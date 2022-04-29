import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {Feed} from "@radiantpm/plugin-types";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "@radiantpm/plugin-utils";
import {getJson, setJson} from "@radiantpm/plugin-utils/req-utils";
import endpoints from "./constants/endpoints";
import {getAuthenticationPlugin, getDatabasePlugin} from "./state";

function isFeed(feed: unknown): feed is Feed {
    if (!feed) return false;
    if (typeof feed !== "object") return false;

    if (Object.keys(feed).length !== 2) return false;

    const casted = feed as Feed;
    if (typeof casted.name !== "string") return false;
    if (typeof casted.slug !== "string") return false;

    return true;
}

export default class CreateFeedMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor() {
        super(`POST ${endpoints.createFeed}`);
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const feed = await getJson(req).catch(cause => {
            throw new HttpError(400, "Invalid body, expecting JSON", {cause});
        });

        if (!isFeed(feed)) {
            throw new HttpError(400, "Invalid feed");
        }

        const authPlugin = getAuthenticationPlugin();
        const dbPlugin = getDatabasePlugin();

        const accessToken = await authPlugin.getAccessToken(req);

        const authenticationResponse = await authPlugin.check(accessToken, {
            kind: "feed.create",
            slug: feed.slug
        });

        if (!authenticationResponse.success) {
            throw new HttpError(403, authenticationResponse.errorMessage);
        }

        if (await dbPlugin.getFeedIdFromSlug(feed.slug)) {
            throw new HttpError(409, "Already exists");
        }

        await dbPlugin.createFeed(feed);

        await setJson(res, 204, feed);
    }
}
