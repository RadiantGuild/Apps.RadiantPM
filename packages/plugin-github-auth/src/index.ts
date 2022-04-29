import {Octokit} from "@octokit/rest";
import {createLogger} from "@radiantpm/log";
import {
    AuthenticationCheckResponse,
    AuthenticationField, AuthenticationListValidResponse,
    AuthenticationLoginChangedResponse, PluginExport,
    Scope
} from "@radiantpm/plugin-types";
import {
    AuthPlugin,
    AuthPluginLoginResult,
    createAuthPlugin
} from "@radiantpm/plugin-utils";
import {SameSite, SetCookieOptions} from "@radiantpm/plugin-utils/req-utils";
import {name, version} from "../package.json";
import {AuthState} from "./types/AuthState";
import Configuration from "./types/Configuration";
import AuthContext from "./utils/AuthContext";
import {switchedScopeHandler} from "./utils/scope-handlers";

const octokitLogger = createLogger("plugin-github-auth:octokit");

const validTokenRegex = /^ghp_[A-Za-z\d]+$/;

class GithubAuthPlugin implements AuthPlugin {
    private static readonly defaultOctokitOptions: Exclude<
        ConstructorParameters<typeof Octokit>[0],
        undefined
    > = {
        userAgent: `${name} ${version}`,
        log: {
            debug: (msg: string) => octokitLogger.debug("%s", msg),
            info: (msg: string) => octokitLogger.info("%s", msg),
            warn: (msg: string) => octokitLogger.warn("%s", msg),
            error: (msg: string) => octokitLogger.error("%s", msg)
        }
    };

    id = "github-auth";
    displayName = "Github";
    accessTokenCookieName = "auth-token";
    accessTokenCookieOptions: SetCookieOptions = {
        expires: new Date(Date.now() + 18144000000 /* 1 month */),
        httpOnly: true,
        sameSite: SameSite.strict,
        path: "/"
    };

    private readonly defaultOctokit: Octokit;

    constructor(private readonly config: Configuration) {
        this.defaultOctokit = new Octokit({
            ...(GithubAuthPlugin.defaultOctokitOptions as Record<string, unknown>),
            auth: config.accessToken
        });
    }

    async check(
        accessToken: string | null,
        scope: Scope
    ): Promise<AuthenticationCheckResponse> {
        const octokit = this.getOctokit(accessToken);
        const authState = await this.getAuthState(octokit);
        const context = new AuthContext(octokit, authState);

        return await switchedScopeHandler.check(scope, this.config, context);
    }

    async listValid(accessToken: string | null, scopeKind: Scope["kind"]): Promise<AuthenticationListValidResponse> {
        const octokit = this.getOctokit(accessToken);
        const authState = await this.getAuthState(octokit);
        const context = new AuthContext(octokit, authState);

        return await switchedScopeHandler.listValid(scopeKind, this.config, context);
    }

    getFields(): AuthenticationField[] {
        return [
            {
                name: "access-token",
                label: "Access Token",
                type: "text",
                description:
                    "An access token from Github, with the `repo` scope if you are using private repositories"
            }
        ];
    }

    async onLogin(
        fields: Record<string, string>
    ): Promise<AuthPluginLoginResult> {
        const accessToken = fields["access-token"];

        if (!accessToken) {
            return {
                success: false,
                errorMessage: "No access token provided"
            };
        }

        const octokit = this.getOctokit(accessToken);

        try {
            await octokit.users.getAuthenticated();

            return {
                success: true,
                accessToken
            };
        } catch (err) {
            if (err instanceof Error && err.message === "Bad credentials") {
                return {
                    success: false,
                    errorMessage: "Invalid access token"
                };
            } else {
                throw err;
            }
        }
    }

    onLoginChanged(
        fields: Record<string, string>
    ): AuthenticationLoginChangedResponse {
        const accessToken = fields["access-token"];

        if (!accessToken) {
            return {
                valid: false,
                errors: [
                    {
                        field: "access-token",
                        message: "Missing"
                    }
                ]
            };
        } else if (!validTokenRegex.test(accessToken)) {
            return {
                valid: false,
                errors: [
                    {
                        field: "access-token",
                        message: "Incorrect format"
                    }
                ]
            };
        }

        return {
            valid: true
        };
    }

    private getOctokit(accessToken?: string | null) {
        if (accessToken) {
            return new Octokit({
                ...(GithubAuthPlugin.defaultOctokitOptions as Record<string, unknown>),
                auth: accessToken,
            });
        } else {
            return this.defaultOctokit;
        }
    }

    private async getAuthState(octokit: Octokit): Promise<AuthState> {
        if (octokit === this.defaultOctokit) {
            return {
                isLoggedIn: false
            };
        } else {
            const user = await octokit.rest.users.getAuthenticated();

            return {
                isLoggedIn: true,
                username: user.data.login
            };
        }
    }
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["accessToken", "feedCreators"],
        properties: {
            accessToken: {
                type: "string"
            },
            feedCreators: {
                type: "array",
                items: {
                    type: "string"
                }
            }
        }
    },
    provides: {
        authentication: "github-auth"
    },
    init(config) {
        return createAuthPlugin(new GithubAuthPlugin(config));
    }
};

export default pluginExport;
