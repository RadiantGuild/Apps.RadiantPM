/**
 * @see DatabasePlugin
 */
import SerialisablePluginBase from "../SerialisablePluginBase";

export default interface SerialisableDatabasePlugin
    extends SerialisablePluginBase<"database"> {
    /**
     * ID that's referenced in `.provides.database`
     */
    id: string;

    /**
     * A GET request returns a `ListFeedsResponse`
     */
    listFeedsUrl: string;

    /**
     * A GET request returns a `Feed`
     *
     * ## Parameters:
     * - `feed_slug`: the feed's slug
     */
    getFeedUrl: string;

    /**
     * A GET request returns a `ListPackagesResponse`
     *
     * ## Parameters:
     * - `feed_slug`: the feed's slug
     */
    listPackagesFromFeedUrl: string;

    /**
     * A GET request returns a `Package`
     *
     * ## Parameters:
     * - `feed_slug`: the slug of the feed that contains this package
     * - `package_slug`: the slug of this package
     */
    getPackageUrl: string;

    /**
     * A GET request returns a `ListVersionsResponse`
     *
     *
     * ## Parameters:
     * - `feed_slug`: the slug of the feed that contains the package that the versions are from
     * - `package_slug`: the slug of the package
     */
    listVersionsFromPackageUrl: string;

    /**
     * A GET request returns a `Version`
     *
     * ## Parametesr:
     * - `feed_slug`: the slug of the feed that contains the package that has the version
     * - `package_slug`: the slug of the package that has the version
     * - `version`: the version number to request
     */
    getVersionUrl: string;
}
