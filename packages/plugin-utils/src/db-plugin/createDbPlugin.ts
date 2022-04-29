import assert from "assert";
import {
    DatabasePlugin, Feed,
    ListFeedsResponse, ListPackagesResponse, ListVersionsResponse, Package,
    Plugin, Version
} from "@radiantpm/plugin-types";
import urljoin from "url-join";
import {createRouteMiddlewarePlugin} from "../middleware-routing";
import {setError, setJson} from "../req-utils";
import DbPlugin from "./DbPlugin";

function getUrl(path: string) {
    return urljoin("/-/db", path) as `/${string}`;
}

const PATHS = {
    listFeeds: getUrl("feeds"),
    getFeed: getUrl("feeds/[feed_slug]"),
    listPackagesFromFeed: getUrl("feeds/[feed_slug]/packages"),
    getPackage: getUrl("feeds/[feed_slug]/packages/[package_slug]"),
    listVersionsFromPackage: getUrl(
        "feeds/[feed_slug]/packages/[package_slug]/versions"
    ),
    getVersion: getUrl(
        "feeds/[feed_slug]/packages/[package_slug]/versions/[version]"
    )
};

class DbDatabasePlugin implements DatabasePlugin {
    readonly type = "database";

    constructor(private readonly plugin: DbPlugin) {}

    get id() {
        return this.plugin.id;
    }

    get listFeedsUrl() {
        return PATHS.listFeeds;
    }

    get getFeedUrl() {
        return PATHS.getFeed;
    }

    get listPackagesFromFeedUrl() {
        return PATHS.listPackagesFromFeed;
    }

    get getPackageUrl() {
        return PATHS.getPackage;
    }

    get listVersionsFromPackageUrl() {
        return PATHS.listVersionsFromPackage;
    }

    get getVersionUrl() {
        return PATHS.getVersion;
    }

    listFeeds() {
        return this.plugin.listFeeds();
    }

    getFeedIdFromSlug(slug: string) {
        return this.plugin.getFeedIdFromSlug(slug);
    }

    getFeedFromId(id: string) {
        return this.plugin.getFeedFromId(id);
    }

    createFeed(feed: Feed) {
        return this.plugin.createFeed(feed);
    }

    listPackagesFromFeed(feedId: string) {
        return this.plugin.listPackagesFromFeed(feedId);
    }

    getPackageIdFromSlug(feedId: string, slug: string) {
        return this.plugin.getPackageIdFromSlug(feedId, slug);
    }

    getPackageFromId(id: string) {
        return this.plugin.getPackageFromId(id);
    }

    createPackage(feedId: string, pkg: Package) {
        return this.plugin.createPackage(feedId, pkg);
    }

    createVersion(packageId: string, version: Version) {
        return this.plugin.createVersion(packageId, version);
    }

    listVersionsFromPackage(packageId: string) {
        return this.plugin.listVersionsFromPackage(packageId);
    }

    getVersionId(packageId: string, version: string) {
        return this.plugin.getVersionId(packageId, version);
    }

    getVersionFromId(id: string) {
        return this.plugin.getVersionFromId(id);
    }
}

export default function createDbPlugin(plugin: DbPlugin): Plugin[] {
    return [
        new DbDatabasePlugin(plugin),
        createRouteMiddlewarePlugin(`GET ${PATHS.listFeeds}`, async ({res}) => {
            const feeds = await plugin.listFeeds();

            const response: ListFeedsResponse = {
                feeds
            };

            await setJson(res, 200, response);
        }),
        createRouteMiddlewarePlugin(
            `GET ${PATHS.getFeed}`,
            async ({res, params}) => {
                const feedSlug = params.get("feed_slug");
                assert(feedSlug, "Missing feed_slug");

                const feedId = await plugin.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    await setError(res, "Feed does not exist", 404);
                    return;
                }

                const feed = await plugin.getFeedFromId(feedId);

                await setJson(res, 200, feed);
            }
        ),
        createRouteMiddlewarePlugin(
            `GET ${PATHS.listPackagesFromFeed}`,
            async ({res, params}) => {
                const feedSlug = params.get("feed_slug");
                assert(feedSlug, "Missing feed_slug");

                const feedId = await plugin.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    await setError(res, "Feed does not exist", 404);
                    return;
                }

                const packages = await plugin.listPackagesFromFeed(feedId);

                const response: ListPackagesResponse = {
                    packages
                };

                await setJson(res, 200, response);
            }
        ),
        createRouteMiddlewarePlugin(
            `GET ${PATHS.getPackage}`,
            async ({res, params}) => {
                const feedSlug = params.get("feed_slug");
                assert(feedSlug, "Missing feed_slug");

                const packageSlug = params.get("package_slug");
                assert(packageSlug, "Missing package_slug");

                const feedId = await plugin.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    await setError(res, "Feed does not exist", 404);
                    return;
                }

                const packageId = await plugin.getPackageIdFromSlug(feedId, packageSlug);

                if (!packageId) {
                    await setError(res, "Package does not exist", 404);
                    return;
                }

                const pkg = await plugin.getPackageFromId(packageId);

                await setJson(res, 200, pkg);
            }
        ),
        createRouteMiddlewarePlugin(
            `GET ${PATHS.listVersionsFromPackage}`,
            async ({res, params}) => {
                const feedSlug = params.get("feed_slug");
                assert(feedSlug, "Missing feed_slug");

                const packageSlug = params.get("package_slug");
                assert(packageSlug, "Missing package_slug");

                const feedId = await plugin.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    await setError(res, "Feed does not exist", 404);
                    return;
                }

                const packageId = await plugin.getPackageIdFromSlug(feedId, packageSlug);

                if (!packageId) {
                    await setError(res, "Package does not exist", 404);
                    return;
                }

                const versions = await plugin.listVersionsFromPackage(packageId);

                const response: ListVersionsResponse = {
                    versions
                };

                await setJson(res, 200, response);
            }
        ),
        createRouteMiddlewarePlugin(
            `GET ${PATHS.getVersion}`,
            async ({res, params}) => {
                const feedSlug = params.get("feed_slug");
                assert(feedSlug, "Missing feed_slug");

                const packageSlug = params.get("package_slug");
                assert(packageSlug, "Missing package_slug");

                const versionName = params.get("version");
                assert(versionName, "Missing version");

                const feedId = await plugin.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    await setError(res, "Feed does not exist", 404);
                    return;
                }

                const packageId = await plugin.getPackageIdFromSlug(feedId, packageSlug);

                if (!packageId) {
                    await setError(res, "Package does not exist", 404);
                    return;
                }

                const versionId = await plugin.getVersionId(packageId, versionName);

                if (!versionId) {
                    await setError(res, "Version does not exist", 404);
                    return;
                }

                const version = await plugin.getVersionFromId(versionId);

                await setJson(res, 200, version);
            }
        )
    ];
}
