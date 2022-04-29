import assert from "assert";
import {createLogger} from "@radiantpm/log";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {
    AuthenticationPlugin,
    DatabasePlugin,
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

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    onMetaLoaded(meta) {
        authPlugin = meta.selectedPlugins.authentication;
        dbPlugin = meta.selectedPlugins.database;
    },

    init() {
        return [
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
            )
        ];
    }
};

export default pluginExport;
