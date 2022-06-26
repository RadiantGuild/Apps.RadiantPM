import PluginBase from "../PluginBase";
import {Feed, SimpleFeed} from "./Feed";
import {Package, SimplePackage} from "./Package";
import {SimpleVersion, Version} from "./Version";

export default interface DatabasePlugin extends PluginBase<"database"> {
    /**
     * ID that's referenced in `.provides.database`
     */
    id: string;

    listFeeds(): Promise<readonly SimpleFeed[]>;

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
