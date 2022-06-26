import {
    DatabasePlugin,
    Feed,
    Package,
    Plugin,
    Version
} from "@radiantpm/plugin-types";
import DbPlugin from "./DbPlugin";

class DbDatabasePlugin implements DatabasePlugin {
    readonly type = "database";

    constructor(private readonly plugin: DbPlugin) {}

    get id() {
        return this.plugin.id;
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

export default function createDbPlugin(plugin: DbPlugin): Plugin {
    return new DbDatabasePlugin(plugin);
}
