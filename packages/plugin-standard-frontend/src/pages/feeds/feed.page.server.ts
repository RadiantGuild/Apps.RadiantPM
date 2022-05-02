import assert from "assert";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {SimplePackage} from "@radiantpm/plugin-types";
import {FeedPageProps} from "~/pages/feeds/feed.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<FeedPageProps> {
    const dbPlugin = pageContext.plugins.database;
    const authPlugin = pageContext.plugins.authentication;

    const {feedSlug} = pageContext.routeParams;
    assert(feedSlug, "Missing feed slug");

    const accessToken = await authPlugin.getAccessToken(pageContext.httpRequest);

    const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);

    const feedAuth = await authPlugin.check(accessToken, {
        kind: "feed.view",
        slug: feedSlug
    });

    if (!feedId || !feedAuth.success) {
        throw new HttpError(404, `Feed \`${feedSlug}\` does not exist`);
    }

    const feed = await dbPlugin.getFeedFromId(feedId);

    const packages = await dbPlugin.listPackagesFromFeed(feedId);

    const packagesWithVerNames = await Promise.all(
        packages.map(async pkg => {
            if (!pkg.latestVersion) return pkg;

            const authResult = await authPlugin.check(accessToken, {
                kind: "package.view",
                feedSlug,
                slug: pkg.slug
            });

            if (!authResult.success) return;

            const latestVersion = await dbPlugin.getVersionFromId(
                pkg.latestVersion
            );

            return {
                ...pkg,
                latestVersion: latestVersion.slug
            };
        })
    ).then(res => res.filter(Boolean) as SimplePackage[]);

    return {
        pageContext: {
            pageProps: {
                feed,
                packages: packagesWithVerNames
            }
        }
    };
}
