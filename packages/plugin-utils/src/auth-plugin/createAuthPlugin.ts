import assert from "assert";
import {createLogger} from "@radiantpm/log";
import {
    AuthenticationCheckResponse,
    AuthenticationField,
    AuthenticationListValidResponse,
    AuthenticationLoginResponse,
    AuthenticationPlugin,
    AuthenticationPluginExtension,
    BasicUserInfo,
    CustomScope,
    HttpRequest,
    isValidScopeKind,
    Plugin,
    Scope
} from "@radiantpm/plugin-types";
import urljoin from "url-join";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "../middleware-routing";
import {
    addCookie,
    getCookie,
    getJson,
    removeCookie,
    setError,
    setJson
} from "../req-utils";
import AuthPlugin from "./AuthPlugin";
import {parseScopeStringWithErrorChecking} from "./scope-string";

const logger = createLogger("plugin-utils:auth-plugin");

function getUrl(endpoint: string) {
    return urljoin(`/-/auth/${endpoint}`) as `/${string}`;
}

function getAccessToken(plugin: AuthPlugin, req: HttpRequest) {
    const cookieValue = getCookie(req, plugin.accessTokenCookieName);
    if (cookieValue) return cookieValue;

    const header = req.headers.get("authorization");
    if (!header) return null;

    if (header.startsWith("Bearer ")) return header.substring("Bearer ".length);

    return null;
}

class AuthAuthenticationPlugin implements AuthenticationPlugin {
    readonly type = "authentication" as const;

    /**
     * Allows special information to be added to the plugin to be used later
     */
    [context: symbol]: unknown;

    readonly isRequired?: (scope: Scope) => boolean | Promise<boolean>;
    readonly getHelpText?: () => string | Promise<string>;
    readonly checkAccessTokenValidity?: (accessToken: string) => boolean;
    #extensions = new Map<string, AuthenticationPluginExtension>();

    constructor(private readonly plugin: AuthPlugin) {
        this.isRequired = this.plugin.isRequired?.bind(this.plugin);
        this.getHelpText = this.plugin.getHelpText?.bind(this.plugin);
        this.checkAccessTokenValidity =
            this.plugin.checkAccessTokenValidity?.bind(this.plugin);
    }

    get id() {
        return this.plugin.id;
    }

    get displayName() {
        return this.plugin.displayName;
    }

    get hasValidAccessTokenUrl() {
        return getUrl("validate");
    }

    get checkUrl() {
        return getUrl("check");
    }

    get listValidUrl() {
        return getUrl("list-valid");
    }

    get isRequiredUrl() {
        return getUrl("required");
    }

    get loginChangedUrl() {
        return getUrl("login-changed");
    }

    get loginUrl() {
        return getUrl("login");
    }

    get logoutUrl() {
        return getUrl("logout");
    }

    private static runOnMaybePromise<T>(
        result: T | Promise<T>,
        fn: (res: T) => void
    ): T | Promise<T> {
        if (result instanceof Promise) {
            return result.then(res => {
                fn(res);
                return res;
            });
        } else {
            fn(result);
            return result;
        }
    }

    private static assertCustomScopeKind(
        scopeKind: Scope["kind"]
    ): asserts scopeKind is CustomScope["kind"] {
        assert(scopeKind.indexOf(":") !== -1, "scope is not a custom scope");
    }

    extend(id: string, extension: AuthenticationPluginExtension) {
        if (this.#extensions.has(id)) {
            throw new Error(
                `Multiple auth extensions tried to use the ID \`${id}\``
            );
        }

        this.#extensions.set(id, extension);
    }

    getFields(): AuthenticationField[] | Promise<AuthenticationField[]> {
        return this.plugin.getFields();
    }

    check(
        accessToken: string | null,
        scope: Scope
    ): AuthenticationCheckResponse | Promise<AuthenticationCheckResponse> {
        const scopeNamespaceSepIdx = scope.kind.indexOf(":");

        let result:
            | AuthenticationCheckResponse
            | Promise<AuthenticationCheckResponse>;

        if (scopeNamespaceSepIdx !== -1) {
            AuthAuthenticationPlugin.assertCustomScopeKind(scope.kind);

            const extensionId = scope.kind.substring(0, scopeNamespaceSepIdx);
            const extension = this.#extensions.get(extensionId);

            if (!extension) {
                throw new Error(`No extension with ID \`${extensionId}\``);
            }

            result = extension.check(accessToken, scope);
        } else {
            result = this.plugin.check(accessToken, scope);
        }

        return AuthAuthenticationPlugin.runOnMaybePromise(result, res => {
            if (res.success) {
                logger.trace(
                    "Authentication check for %s was successful",
                    scope.kind
                );
            } else {
                logger.trace(
                    "Authentication check for %s was not successful: %s",
                    scope.kind,
                    res.errorMessage
                );
            }
        });
    }

    getAccessToken(req: HttpRequest): string | null {
        return getAccessToken(this.plugin, req);
    }

    listValid(
        accessToken: string | null,
        scopeKind: Scope["kind"]
    ):
        | AuthenticationListValidResponse
        | Promise<AuthenticationListValidResponse> {
        return this.plugin.listValid(accessToken, scopeKind);
    }

    getBasicUserInfo(accessToken: string): Promise<BasicUserInfo> {
        return this.plugin.getBasicUserInfo(accessToken);
    }
}

function traceUserError(message: string, thrown?: Error) {
    if (thrown) {
        logger.trace(thrown, "User-caused error: %s", message);
    } else {
        logger.trace("User-caused error: %s", message);
    }
}

class AuthLoginMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor(private readonly plugin: AuthPlugin) {
        super(`POST ${getUrl("login")}`);
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const fields = await getJson<Record<string, string>>(req);

        if (
            fields == null ||
            typeof fields !== "object" ||
            Array.isArray(fields)
        ) {
            traceUserError("request body was not an object");
            await setError(res, "request body must be an object");
            return;
        }

        const result = await this.plugin.onLogin(fields, req.signal);

        if (result.success) {
            await addCookie(
                res,
                this.plugin.accessTokenCookieName,
                result.accessToken,
                this.plugin.accessTokenCookieOptions
            );

            await setJson(res, 200, result as AuthenticationLoginResponse);
        } else {
            await setJson(res, 401, result as AuthenticationLoginResponse);
        }
    }
}

class AuthLogoutMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor(private readonly plugin: AuthPlugin) {
        super(`GET ${getUrl("logout")}`);
    }

    async run({res}: RoutedRequestContext): Promise<void> {
        await removeCookie(res, this.plugin.accessTokenCookieName);
        await res.flushHeaders(201);
    }
}

class AuthLoginChangedMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor(private readonly plugin: AuthPlugin) {
        super(`GET ${getUrl("login-changed")}`);
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const fields = Object.fromEntries(
            Array.from(req.url.searchParams.entries())
        );

        const result = await this.plugin.onLoginChanged(fields, req.signal);

        if (result.valid) {
            await setJson(res, 200, result);
        } else {
            await setJson(res, 400, result);
        }
    }
}

class AuthCheckMiddlewarePlugin extends RouteMiddlewarePlugin {
    private readonly plugin: AuthPlugin;

    constructor(plugin: AuthPlugin) {
        super(`GET ${getUrl("check")}`);
        this.plugin = plugin;
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const scopeStr = req.url.searchParams.get("scope");

        const accessToken = getAccessToken(this.plugin, req);

        if (!scopeStr) {
            traceUserError("`scope` query parameter was not set");
            await setError(res, "scope query parameter must be set");
            return;
        }

        const scope = parseScopeStringWithErrorChecking(scopeStr);

        if (scope.kind === "error") {
            const {message, thrown} = scope;
            traceUserError(message, thrown);
            await setError(res, message);
            return;
        }

        const result = await this.plugin.check(accessToken, scope.result);

        await setJson(res, 200, result);
    }
}

class AuthListValidMiddlewarePlugin extends RouteMiddlewarePlugin {
    private readonly plugin: AuthPlugin;

    constructor(plugin: AuthPlugin) {
        super(`GET ${getUrl("list-valid")}`);
        this.plugin = plugin;
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const scopeKind = req.url.searchParams.get("kind");

        const accessToken = getAccessToken(this.plugin, req);

        if (!scopeKind) {
            traceUserError("`kind` query parameter was not set");
            await setError(res, "kind query parameter must be set");
            return;
        }

        if (!isValidScopeKind(scopeKind)) {
            traceUserError("`kind` query parameter is not a valid scope kind");
            await setError(
                res,
                "kind query parameter must be a valid scope kind"
            );
            return;
        }

        const result = await this.plugin.listValid(accessToken, scopeKind);

        await setJson(res, 200, result);
    }
}

class AuthIsRequiredMiddlewarePlugin extends RouteMiddlewarePlugin {
    private readonly plugin: AuthPlugin;

    constructor(plugin: AuthPlugin) {
        super(`GET ${getUrl("required")}`);
        this.plugin = plugin;
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const scopeStr = req.url.searchParams.get("scope");

        if (!scopeStr) {
            traceUserError("`scope` query parameter was not set");
            await setError(res, "scope query parameter must be set");
            return;
        }

        const scope = parseScopeStringWithErrorChecking(scopeStr);

        if (scope.kind === "error") {
            const {message, thrown} = scope;
            traceUserError(message, thrown);
            await setError(res, message);
            return;
        }

        const result = (await this.plugin.isRequired?.(scope.result)) ?? true;

        await setJson(res, 200, result);
    }
}

class AuthValidateMiddlewarePlugin extends RouteMiddlewarePlugin {
    private readonly plugin: AuthPlugin;

    constructor(plugin: AuthPlugin) {
        super(`HEAD ${getUrl("validate")}`);
        this.plugin = plugin;
    }

    async run({req, res}: RoutedRequestContext) {
        const accessToken = getAccessToken(this.plugin, req);

        if (
            !accessToken ||
            !(this.plugin.checkAccessTokenValidity?.(accessToken) ?? true)
        ) {
            await res.flushHeaders(401);
        }

        if (accessToken) {
            // Refresh the cookie to keep the user logged in
            await addCookie(
                res,
                this.plugin.accessTokenCookieName,
                accessToken,
                this.plugin.accessTokenCookieOptions
            );
        }

        await res.flushHeaders(204);
    }
}

/**
 * Handles the creation of middleware plugins for methods that need to be able to be called by the frontend,
 * and storage of the user's access token
 */
export default function createAuthPlugin(plugin: AuthPlugin): Plugin[] {
    return [
        new AuthAuthenticationPlugin(plugin),
        new AuthLoginMiddlewarePlugin(plugin),
        new AuthLoginChangedMiddlewarePlugin(plugin),
        new AuthLogoutMiddlewarePlugin(plugin),
        new AuthCheckMiddlewarePlugin(plugin),
        new AuthListValidMiddlewarePlugin(plugin),
        new AuthIsRequiredMiddlewarePlugin(plugin),
        new AuthValidateMiddlewarePlugin(plugin)
    ];
}
