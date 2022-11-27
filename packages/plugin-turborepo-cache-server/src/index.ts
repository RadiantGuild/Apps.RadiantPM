import assert from "assert";
import {randomBytes} from "crypto";
import {URLSearchParams} from "url";
import {createLogger} from "@radiantpm/log";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {
    AuthenticationPlugin,
    CachePlugin,
    DatabasePlugin,
    EnvironmentMetadata,
    HttpRequest,
    MiddlewareError,
    PluginExport
} from "@radiantpm/plugin-types";
import {
    createRouteMiddlewarePlugin,
    RoutedRequestContext
} from "@radiantpm/plugin-utils";
import {
    getBuffer,
    redirect,
    setError,
    setJson
} from "@radiantpm/plugin-utils/req-utils";
import {switchedScopeHandler} from "./scope-handlers";

const logger = createLogger("plugin-turborepo-cache-server");

let authPlugin: AuthenticationPlugin;
let cachePlugin: CachePlugin;
let dbPlugin: DatabasePlugin;

function getErrorMessage(err: unknown): string {
    if (err instanceof Error && !(err as MiddlewareError).isMessageSensitive) {
        return err.message;
    } else {
        return "Internal server error";
    }
}

function getArtefactCacheKey(hash: string) {
    return `turborepo-cache.artefact.${hash}`;
}

function getRedirectUriKey(uid: string) {
    return `turborepo-cache.redirect-uri.${uid}`;
}

async function setRedirectUri(redirectUri: string) {
    const uid = randomBytes(16).toString("hex");
    const key = getRedirectUriKey(uid);
    await cachePlugin.set(key, Buffer.from(redirectUri, "utf8"), {
        expireInSeconds: 600
    });
    return uid;
}

function getBearerAccessToken(req: HttpRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.substring("Bearer ".length);

    if (!authHeader.startsWith("Bearer ") || !token) {
        throw new HttpError(400, "Authorization header is not a bearer token");
    }

    return token;
}

function getTeamSlugFromQuery(req: HttpRequest) {
    const searchParams = req.url.searchParams;

    const teamId = searchParams.get("teamId");
    if (teamId && teamId.startsWith("team_")) {
        const slug = teamId.substring("team_".length);
        if (slug) return slug;
    }

    return searchParams.get("slug");
}

async function getTeamFromQuery(req: HttpRequest) {
    const teamId = getTeamSlugFromQuery(req);
    if (!teamId) return null;

    const [feedSlug, packageSlug] = teamId.split("+", 2);

    const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);
    if (!feedId) return null;

    const packageId = await dbPlugin.getPackageIdFromSlug(feedId, packageSlug);
    if (!packageId) return null;

    const [feed, pkg] = await Promise.all([
        dbPlugin.getFeedFromId(feedId),
        dbPlugin.getPackageFromId(packageId)
    ]);

    return {feed, pkg};
}

async function getRedirectUri(uid: string) {
    const key = getRedirectUriKey(uid);
    const uri = await cachePlugin.get(key);
    if (!uri) return null;
    return uri.toString("utf8");
}

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,
    init() {
        return [
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/turborepo/token",
                async (ctx: RoutedRequestContext) => {
                    const redirectUri =
                        ctx.req.url.searchParams.get("redirect_uri");

                    if (!redirectUri) {
                        throw new HttpError(
                            400,
                            "Missing redirect_uri parameter"
                        );
                    }

                    const uid = await setRedirectUri(redirectUri);

                    const searchParams = new URLSearchParams({
                        return: "/-/turborepo-cache/token-redirect?uid=" + uid,
                        app: "Turborepo"
                    });

                    const redirectUrl =
                        "/.well-known/rpm-login?" + searchParams.toString();
                    await redirect(ctx.res, redirectUrl, true);
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/token-redirect",
                async (ctx: RoutedRequestContext) => {
                    const uid = ctx.req.url.searchParams.get("uid");

                    if (!uid) {
                        throw new HttpError(400, "Missing uid parameter");
                    }

                    const redirectUri = await getRedirectUri(uid);

                    if (!redirectUri) {
                        throw new HttpError(400, "Invalid or expired uid");
                    }

                    const accessToken = await authPlugin.getAccessToken(
                        ctx.req
                    );

                    if (!accessToken) {
                        throw new HttpError(400, "Not logged in");
                    }

                    const finalRedirectUri = new URL(redirectUri);
                    finalRedirectUri.searchParams.set("token", accessToken);

                    await redirect(ctx.res, finalRedirectUri);
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/turborepo/success",
                async (ctx: RoutedRequestContext) => {
                    const redirectUrl =
                        "/.well-known/rpm-login/success?app=Turborepo";
                    await redirect(ctx.res, redirectUrl, true);
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/v2/user",
                async (ctx: RoutedRequestContext) => {
                    const accessToken = getBearerAccessToken(ctx.req);

                    if (!accessToken) {
                        throw new HttpError(401, "No bearer token");
                    }

                    const user = await authPlugin.getBasicUserInfo(accessToken);

                    await setJson(ctx.res, 200, {
                        user: {
                            email: user.displayIdentifier,
                            name: "Personal access only"
                        }
                    });
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/v2/teams",
                async (ctx: RoutedRequestContext) => {
                    const accessToken = getBearerAccessToken(ctx.req);

                    if (!accessToken) {
                        throw new HttpError(401, "No bearer token");
                    }

                    const allFeeds = await dbPlugin.listFeeds();

                    const teams = await Promise.all(
                        allFeeds.map(async feed => {
                            const {success} = await authPlugin.check(
                                accessToken,
                                {
                                    kind: "feed.view",
                                    slug: feed.slug
                                }
                            );

                            if (!success) return false;

                            const feedId = await dbPlugin.getFeedIdFromSlug(
                                feed.slug
                            );
                            assert(feedId, "missing id for feed");

                            const packages =
                                await dbPlugin.listPackagesFromFeed(feedId);

                            return await Promise.all(
                                packages.map(async pkg => {
                                    const {success} = await authPlugin.check(
                                        accessToken,
                                        {
                                            kind: "package.view",
                                            slug: pkg.slug,
                                            feedSlug: feed.slug
                                        }
                                    );

                                    if (!success) return false;

                                    return {
                                        id: `team_${feed.slug}+${pkg.slug}`,
                                        name: `${feed.name}: ${pkg.name}`
                                    };
                                })
                            ).then(teams => teams.filter(Boolean));
                        })
                    ).then(teams => teams.filter(Boolean).flat());

                    await setJson(ctx.res, 200, {
                        teams,
                        pagination: {
                            count: 0,
                            next: 0,
                            prev: 0
                        }
                    });
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/v8/artifacts/status",
                async (ctx: RoutedRequestContext) => {
                    const bodyRes = await ctx.res.flushHeaders(200);

                    const accessToken = authPlugin.getAccessToken(ctx.req);

                    if (!accessToken) {
                        throw new HttpError(401);
                    }

                    await setJson(bodyRes, {
                        status: "enabled"
                    });
                }
            ),
            createRouteMiddlewarePlugin(
                "POST /-/turborepo-cache/v8/artifacts/events",
                async (ctx: RoutedRequestContext) => {
                    // Events are ignored for now
                    await ctx.res.flushHeaders(200);
                }
            ),
            createRouteMiddlewarePlugin(
                "PUT /-/turborepo-cache/v8/artifacts/[hash]",
                async (ctx: RoutedRequestContext) => {
                    const hash = ctx.params.get("hash");
                    assert(hash, "Missing hash");

                    const accessToken = getBearerAccessToken(ctx.req);

                    const team = await getTeamFromQuery(ctx.req);

                    if (!team) {
                        await setError(
                            ctx.res,
                            "Either the team doesn't exist, or you don't have permission to read its cache"
                        );

                        return;
                    }

                    const cacheUpdateAuthResult = await authPlugin.check(
                        accessToken,
                        {
                            kind: "turborepo-cs:cache.update",
                            feedSlug: team.feed.slug,
                            packageSlug: team.pkg.slug
                        }
                    );

                    if (!cacheUpdateAuthResult.success) {
                        await setError(
                            ctx.res,
                            "Not allowed to write to the cache",
                            403
                        );
                        return;
                    }

                    logger.debug("Writing artefact %s", hash);

                    const body = await getBuffer(ctx.req);

                    await cachePlugin.set(getArtefactCacheKey(hash), body, {
                        // expire in one week
                        expireInSeconds: 60 * 60 * 24 * 7
                    });

                    await ctx.res.flushHeaders(200);
                }
            ),
            createRouteMiddlewarePlugin(
                "GET /-/turborepo-cache/v8/artifacts/[hash]",
                async (ctx: RoutedRequestContext) => {
                    const hash = ctx.params.get("hash");
                    assert(hash, "Missing hash");

                    const accessToken = getBearerAccessToken(ctx.req);

                    const team = await getTeamFromQuery(ctx.req);

                    if (!team) {
                        await setError(
                            ctx.res,
                            "Either the team doesn't exist, or you don't have permission to read its cache"
                        );

                        return;
                    }

                    const cacheViewAuthResult = await authPlugin.check(
                        accessToken,
                        {
                            kind: "turborepo-cs:cache.view",
                            feedSlug: team.feed.slug,
                            packageSlug: team.pkg.slug
                        }
                    );

                    if (!cacheViewAuthResult.success) {
                        await setError(
                            ctx.res,
                            "Either the team doesn't exist, or you don't have permission to read its cache"
                        );

                        return;
                    }

                    logger.debug("Loading artefact %s", hash);

                    const cachedValue = await cachePlugin.get(
                        getArtefactCacheKey(hash)
                    );

                    if (!cachedValue) {
                        throw new HttpError(
                            404,
                            "Cache artefact does not exist, or has expired"
                        );
                    }

                    const bodyRes = await ctx.res.flushHeaders(200);
                    bodyRes.body.write(cachedValue);
                    await bodyRes.flushBody();
                }
            )
        ];
    },
    onMetaLoaded(meta: EnvironmentMetadata) {
        authPlugin = meta.selectedPlugins.authentication;
        cachePlugin = meta.selectedPlugins.cache;
        dbPlugin = meta.selectedPlugins.database;

        authPlugin.extend("turborepo-cs", {
            scopes: [
                {
                    id: "cache.view",
                    description: "Read the Turborepo cache"
                }
            ],
            async check(accessToken, scope) {
                try {
                    return await switchedScopeHandler.check(scope, {
                        authPlugin,
                        accessToken
                    });
                } catch (err) {
                    return {
                        success: false,
                        errorMessage: getErrorMessage(err)
                    };
                }
            },
            async listValid(accessToken, scopeKind) {
                try {
                    return await switchedScopeHandler.listValid(scopeKind, {
                        authPlugin,
                        accessToken
                    });
                } catch (err) {
                    return {
                        validObjects: [],
                        errorMessage: getErrorMessage(err)
                    };
                }
            }
        });
    }
};

export default pluginExport;
