import PluginBase from "../PluginBase";
import {Feed, SimpleFeed} from "./Feed";
import {Package, SimplePackage} from "./Package";
import {SimpleVersion, Version} from "./Version";

export default interface DatabasePlugin extends PluginBase<"database"> {
    /**
     * ID that's referenced in `.provides.database`
     */
    id: string;

    /**
     * A GET request to this URL should return a `ListFeedsResponse`
     */
    listFeedsUrl: string;

    /**
     * A GET request to this URL should return a `Feed`
     *
     * ## Parameters:
     * - `feed_slug`: the feed's slug
     */
    getFeedUrl: string;

    /**
     * A GET request to this URL should return a `ListPackagesResponse`
     *
     * ## Parameters:
     * - `feed_slug`: the feed's slug
     */
    listPackagesFromFeedUrl: string;

    /**
     * A GET request to this URL should return a `Package`
     *
     * ## Parameters:
     * - `feed_slug`: the slug of the feed that contains this package
     * - `package_slug`: the slug of this package
     */
    getPackageUrl: string;

    /**
     * A GET request to this URL should return a `ListVersionsResponse`
     *
     *
     * ## Parameters:
     * - `feed_slug`: the slug of the feed that contains the package that the versions are from
     * - `package_slug`: the slug of the package
     */
    listVersionsFromPackageUrl: string;

    /**
     * A GET request to this URL should return a `Version`
     *
     * ## Parametesr:
     * - `feed_slug`: the slug of the feed that contains the package that has the version
     * - `package_slug`: the slug of the package that has the version
     * - `version`: the version number to request
     */
    getVersionUrl: string;

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

    createPackage(feedId: string, pkg: Package): void;

    listVersionsFromPackage(
        packageId: string
    ): Promise<readonly SimpleVersion[]>;

    getVersionId(
        packageId: string,
        version: string
    ): Promise<string | undefined>;

    getVersionFromId(id: string): Promise<Version>;

    createVersion(packageId: string, version: Version): void;
}
