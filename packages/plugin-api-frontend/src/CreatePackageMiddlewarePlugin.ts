import assert from "assert";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {Package} from "@radiantpm/plugin-types";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "@radiantpm/plugin-utils";
import {getJson, setJson} from "@radiantpm/plugin-utils/req-utils";
import endpoints from "./constants/endpoints";
import {getAuthenticationPlugin, getDatabasePlugin} from "./state";

function isPackage(pkg: unknown): pkg is Package {
    if (!pkg) return false;
    if (typeof pkg !== "object") return false;

    const casted = pkg as Package;
    if (typeof casted.name !== "string") return false;
    if (typeof casted.slug !== "string") return false;
    if (typeof casted.description !== "string") return false;
    if (typeof casted.type !== "string") return false;

    if (
        typeof casted.repository !== "string" &&
        typeof casted.repository !== "undefined"
    ) {
        return false;
    }

    return true;
}

export default class CreatePackageMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor() {
        super(`POST ${endpoints.createPackage}`);
    }

    async run({req, res, params}: RoutedRequestContext): Promise<void> {
        const feedSlug = params.get("feed_slug");

        assert(feedSlug, "Missing feed_slug");

        const pkg = await getJson(req).catch(cause => {
            throw new HttpError(400, "Invalid body, expecting JSON", {cause});
        });

        if (!isPackage(pkg)) {
            throw new HttpError(400, "Invalid package");
        }

        const authPlugin = getAuthenticationPlugin();
        const dbPlugin = getDatabasePlugin();

        const accessToken = await authPlugin.getAccessToken(req);

        const feedViewAuthRes = await authPlugin.check(accessToken, {
            kind: "feed.view",
            slug: feedSlug
        });

        const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);

        if (!feedViewAuthRes.success || !feedId) {
            throw new HttpError(
                404,
                "Feed does not exist or you don't have permission to see it"
            );
        }

        const packageCreateAuthRes = await authPlugin.check(accessToken, {
            kind: "package.create",
            feedSlug,
            slug: pkg.slug,
            repository: pkg.repository
        });

        if (!packageCreateAuthRes.success) {
            throw new HttpError(403, packageCreateAuthRes.errorMessage);
        }

        if (await dbPlugin.getPackageIdFromSlug(feedId, pkg.slug)) {
            throw new HttpError(409, "Already exists");
        }

        await dbPlugin.createPackage(feedId, pkg);

        await setJson(res, 204, pkg);
    }
}
