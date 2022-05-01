import PluginBase from "../PluginBase";

export default interface PackageHandlerPlugin extends PluginBase<"package-handler"> {
    packageType: string;

    /**
     * Checks if the package name works with the specified feed slug
     */
    feedSlugMatches(packageName: string, feedSlug: string): boolean;

    /**
     * Gets the name of the RadiantPM package from the name of the uploaded package
     */
    getPackageName(packageName: string): string;
}
