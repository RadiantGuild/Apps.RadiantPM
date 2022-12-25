import {existsSync} from "fs";
import {readFile} from "fs/promises";
import {Octokit} from "@octokit/rest";
import {createLogger} from "@radiantpm/log";
import {
    AuthenticationCheckResponse,
    AuthenticationField,
    AuthenticationListValidResponse,
    AuthenticationLoginChangedResponse,
    CachePlugin,
    CacheSetOptions,
    DatabasePlugin,
    EnvironmentMetadata,
    MiddlewareError,
    PackageHandlerPlugin,
    PluginExport,
    Scope
} from "@radiantpm/plugin-types";
import {
    AuthPlugin,
    AuthPluginLoginResult,
    createAuthPlugin
} from "@radiantpm/plugin-utils";
import {SameSite, SetCookieOptions} from "@radiantpm/plugin-utils/req-utils";
import Cryptr from "cryptr";
import hasha from "hasha";
import objectHash from "object-hash";
import {name, version} from "../package.json";
import {AuthState} from "./types/AuthState";
import Configuration from "./types/Configuration";
import AuthContext from "./utils/AuthContext";
import {switchedScopeHandler} from "./utils/scope-handlers";

const logger = createLogger("plugin-github-auth");
const octokitLogger = createLogger("plugin-github-auth:octokit");

const validTokenRegex = /^ghp_[A-Za-z\d]+$/;

function getErrorMessage(err: unknown): string {
    if (err instanceof Error && !(err as MiddlewareError).isMessageSensitive) {
        return err.message;
    } else {
        return "Internal server error";
    }
}

function getAccessTokenKey(accessToken: string | null) {
    return accessToken === null ? "##NULL##" : "##TOKEN##" + accessToken;
}

function getCacheKey(
    action: string,
    accessToken: string | null,
    scope: Parameters<typeof objectHash>[0]
) {
    const tokenKey = getAccessTokenKey(accessToken);

    const accessTokenHash = hasha(tokenKey);
    const scopeHash = objectHash(scope);

    return `gh-auth.scope-${action}.${accessTokenHash}.${scopeHash}`;
}

async function writeEncryptedCacheValue(
    cacheKey: string,
    accessToken: string | null,
    valueToWrite: string,
    options?: CacheSetOptions
): Promise<void> {
    const tokenKey = getAccessTokenKey(accessToken);
    const cryptr = new Cryptr(tokenKey);
    const encrypted = cryptr.encrypt(valueToWrite);
    const bufferFromEncrypted = Buffer.from(encrypted, "hex");
    await cachePlugin.set(cacheKey, bufferFromEncrypted, options);
}

async function readEncryptedCacheValue(
    cacheKey: string,
    accessToken: string | null
): Promise<string | null> {
    const tokenKey = getAccessTokenKey(accessToken);
    const cryptr = new Cryptr(tokenKey);
    const cachedBuffer = await cachePlugin.get(cacheKey);
    if (!cachedBuffer) return null;

    return cryptr.decrypt(cachedBuffer.toString("hex"));
}

let dbPlugin: DatabasePlugin;
let cachePlugin: CachePlugin;
let packageHandlers: PackageHandlerPlugin[];

interface OctokitMetadata {
    isDefault: boolean;
}

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

    private static octokitMetadata = new WeakMap<Octokit, OctokitMetadata>();

    id = "github-auth";
    displayName = "Github";
    accessTokenCookieName = "auth-token";
    accessTokenCookieOptions: SetCookieOptions = {
        expires: new Date(Date.now() + 18144000000 /* 1 month */),
        httpOnly: true,
        sameSite: SameSite.strict,
        path: "/"
    };

    private defaultAccessToken: string;

    constructor(private readonly config: Configuration) {}

    async check(
        accessToken: string | null,
        scope: Scope
    ): Promise<AuthenticationCheckResponse> {
        const cacheKey = getCacheKey(`check.${scope.kind}`, accessToken, scope);
        const existingResult = await readEncryptedCacheValue(
            cacheKey,
            accessToken
        );

        if (existingResult) {
            logger.debug("Cache hit for scope check");
            return JSON.parse(existingResult);
        }

        const octokit = this.getOctokit(accessToken);
        const authState = await this.getAuthState(octokit);
        const context = new AuthContext({
            octokit,
            dbPlugin,
            authState,
            packageHandlers
        });

        let result: AuthenticationCheckResponse;

        try {
            result = await switchedScopeHandler.check(
                scope,
                this.config,
                context
            );
        } catch (err) {
            result = {
                success: false,
                errorMessage: getErrorMessage(err)
            };
        }

        logger.debug("Cache miss for scope check");

        await writeEncryptedCacheValue(
            cacheKey,
            accessToken,
            JSON.stringify(result),
            {
                expireInSeconds: 600
            }
        );

        return result;
    }

    async listValid(
        accessToken: string | null,
        scopeKind: Scope["kind"]
    ): Promise<AuthenticationListValidResponse> {
        const cacheKey = getCacheKey(`list-valid.${scopeKind}`, accessToken, {
            kind: scopeKind
        });
        const existingResult = await readEncryptedCacheValue(
            cacheKey,
            accessToken
        );

        if (existingResult) {
            logger.debug("Cache hit for valid list");
            return JSON.parse(existingResult);
        }

        const octokit = this.getOctokit(accessToken);
        const authState = await this.getAuthState(octokit);
        const context = new AuthContext({
            octokit,
            dbPlugin,
            authState,
            packageHandlers
        });

        let result: AuthenticationListValidResponse;

        try {
            result = await switchedScopeHandler.listValid(
                scopeKind,
                this.config,
                context
            );
        } catch (err) {
            result = {
                validObjects: [],
                errorMessage: getErrorMessage(err)
            };
        }

        logger.debug("Cache miss for valid list");

        await writeEncryptedCacheValue(
            cacheKey,
            accessToken,
            JSON.stringify(result),
            {
                expireInSeconds: 600
            }
        );

        return result;
    }

    checkAccessTokenValidity(accessToken: string): boolean {
        const octokit = this.getOctokit(accessToken);
        return this.isLoggedIn(octokit);
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

    async initialise() {
        if (!existsSync(this.config.accessTokenFilename)) {
            throw new Error("Github default access token file does not exist");
        }

        const source = await readFile(this.config.accessTokenFilename, "utf8");
        this.defaultAccessToken = source.trim();
    }

    private getOctokit(accessToken?: string | null) {
        if (accessToken) {
            const octokit = new Octokit({
                ...(GithubAuthPlugin.defaultOctokitOptions as Record<
                    string,
                    unknown
                >),
                auth: accessToken
            });

            // todo: send a request to make sure the token works
            GithubAuthPlugin.octokitMetadata.set(octokit, {
                isDefault: false
            });

            return octokit;
        } else {
            const octokit = new Octokit({
                ...(GithubAuthPlugin.defaultOctokitOptions as Record<
                    string,
                    unknown
                >),
                auth: this.defaultAccessToken
            });

            GithubAuthPlugin.octokitMetadata.set(octokit, {
                isDefault: true
            });

            return octokit;
        }
    }

    private async getAuthState(octokit: Octokit): Promise<AuthState> {
        if (!this.isLoggedIn(octokit)) {
            return {
                isLoggedIn: false
            };
        } else {
            try {
                const user = await octokit.rest.users.getAuthenticated();

                return {
                    isLoggedIn: true,
                    username: user.data.login
                };
            } catch (err) {
                logger.trace(
                    err,
                    "Failed to check the user authentication status; counting as unauthenticated"
                );

                return {isLoggedIn: false};
            }
        }
    }

    private isLoggedIn(octokit: Octokit) {
        return (
            GithubAuthPlugin.octokitMetadata.get(octokit)?.isDefault === false
        );
    }
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["accessTokenFilename", "feedCreators"],
        properties: {
            accessTokenFilename: {
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
    async init(config) {
        const plugin = new GithubAuthPlugin(config);
        await plugin.initialise();
        return createAuthPlugin(plugin);
    },
    onMetaLoaded(meta: EnvironmentMetadata) {
        dbPlugin = meta.selectedPlugins.database;
        cachePlugin = meta.selectedPlugins.cache;

        packageHandlers = meta.plugins.filter(
            pl => pl.type === "package-handler"
        ) as PackageHandlerPlugin[];
    }
};

export default pluginExport;
