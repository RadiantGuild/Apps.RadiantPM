import {
    Feed,
    Package,
    SimpleFeed,
    SimplePackage,
    SimpleVersion,
    Version
} from "@radiantpm/plugin-types";

export default interface DbPlugin {
    /**
     * ID that's referenced in `.provides.database`
     */
    id: string;

    listFeeds(): Promise<readonly SimpleFeed[]>;

    hasFeedWithSlug(slug: string): Promise<boolean>;

    getFeedIdFromSlug(slug: string): Promise<string | undefined>;

    getFeedFromId(id: string): Promise<Feed>;

    createFeed(feed: Feed): Promise<void>;

    listPackagesFromFeed(feedId: string): Promise<readonly SimplePackage[]>;

    getPackageIdFromSlug(
        feedId: string,
        slug: string
    ): Promise<string | undefined>;

    getPackageFromId(id: string): Promise<Package>;

    createPackage(feedId: string, pkg: Package): Promise<void>;

    listVersionsFromPackage(
        packageId: string
    ): Promise<readonly SimpleVersion[]>;

    getVersionId(
        packageId: string,
        version: string
    ): Promise<string | undefined>;

    getVersionFromId(id: string): Promise<Version>;

    createVersion(packageId: string, version: Version): Promise<void>;
}
