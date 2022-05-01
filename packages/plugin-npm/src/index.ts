import assert from "assert";
import {createLogger} from "@radiantpm/log";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {
    AuthenticationPlugin,
    DatabasePlugin,
    HttpRequest,
    PluginExport
} from "@radiantpm/plugin-types";
import {
    createRouteMiddlewarePlugin,
    RoutedRequestContext
} from "@radiantpm/plugin-utils";
import {getJson, setJson} from "@radiantpm/plugin-utils/req-utils";

interface CouchLoginBody {
    name: string;
    password: string;
}

let authPlugin: AuthenticationPlugin;
let dbPlugin: DatabasePlugin;

const logger = createLogger("plugin-npm");

interface PackageName {
    /**
     * The scope of the package, or null if it doesn't have one
     */
    scope: string | null;

    /**
     * The name of the package, or null if it has an invalid format
     */
    name: string | null;
}

function parsePackageName(decodedPackageNameInclScope: string): PackageName {
    const match = decodedPackageNameInclScope.match(
        /(?:@(?<scope>[^/]+)\/)?(?<name>.+)/
    );

    if (!match) {
        return {scope: null, name: null};
    }

    return {
        scope: match.groups?.scope ?? null,
        name: match.groups?.name ?? null
    };
}

function getNpmAccessToken(req: HttpRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.substring("Bearer ".length);

    if (!authHeader.startsWith("Bearer ") || !token) {
        throw new HttpError(400, "Authorization header is not a bearer token");
    }

    return token;
}

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    onMetaLoaded(meta) {
        authPlugin = meta.selectedPlugins.authentication;
        dbPlugin = meta.selectedPlugins.database;
    },

    init() {
        return [
            {
                type: "middleware",
                shouldHandle(): boolean {
                    return true;
                },
                async handle(ctx, next): Promise<void> {
                    console.log(ctx.req.method, ctx.req.url.toString());

                    await next();
                }
            },
            createRouteMiddlewarePlugin(
                "PUT /-/npm/[feed_slug]/-/user/[user_id]",
                async (ctx: RoutedRequestContext) => {
                    const feed = ctx.params.get("feed_slug");
                    assert(feed, "Missing feed_slug");

                    const {name, password} = await getJson<CouchLoginBody>(
                        ctx.req
                    );

                    if (!name || !password) {
                        logger.trace(
                            "Invalid request - username or password are missing"
                        );

                        throw new HttpError(
                            400,
                            "Username or password are missing"
                        );
                    }

                    // require that the user has access to the feed
                    const feedAccess = await authPlugin.check(password, {
                        kind: "feed.view",
                        slug: feed
                    });

                    // and check that the feed actually exists
                    const feedExists = !!(await dbPlugin.getFeedIdFromSlug(
                        feed
                    ));

                    if (!feedAccess.success || !feedExists) {
                        logger.trace(
                            "Invalid request - either the feed doesn't exist or the user doesn't have access to it"
                        );

                        throw new HttpError(
                            404,
                            "Feed not found, or you may not have access to it"
                        );
                    }

                    logger.trace("Login successful");

                    await setJson(ctx.res, 200, {
                        token: password
                    });
                },
                "npm login"
            ),
            createRouteMiddlewarePlugin(
                "GET /-/npm/[feed_slug]/[package_name_incl_scope]",
                async (ctx: RoutedRequestContext) => {
                    const feedSlug = ctx.params.get("feed_slug");
                    assert(feedSlug, "Missing feed_slug");

                    const packageNameInclScope = ctx.params.get(
                        "package_name_incl_scope"
                    );

                    assert(
                        packageNameInclScope,
                        "Missing package_name_incl_scope"
                    );

                    const decodedPackageNameInclScope =
                        decodeURIComponent(packageNameInclScope);

                    const {scope, name: packageSlug} = parsePackageName(
                        decodedPackageNameInclScope
                    );

                    if (!scope || !packageSlug) {
                        throw new HttpError(
                            400,
                            "Missing scope in package name"
                        );
                    }

                    if (scope !== feedSlug) {
                        throw new HttpError(
                            400,
                            "Scope does not match the feed slug"
                        );
                    }

                    const accessToken = getNpmAccessToken(ctx.req);

                    const canViewFeed = await authPlugin.check(accessToken, {
                        kind: "feed.view",
                        slug: feedSlug
                    });

                    const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);

                    if (!canViewFeed.success || !feedId) {
                        throw new HttpError(
                            404,
                            "Feed does not exist or you don't have permission to see it"
                        );
                    }

                    const canViewPackage = await authPlugin.check(accessToken, {
                        kind: "package.view",
                        feedSlug,
                        slug: packageSlug
                    });

                    const packageId = await dbPlugin.getPackageIdFromSlug(
                        feedId,
                        packageSlug
                    );

                    if (!canViewPackage.success || !packageId) {
                        throw new HttpError(
                            404,
                            "Package does not exist or you don't have permission to see it"
                        );
                    }
                }
            )
        ];
    }
};

export default pluginExport;
