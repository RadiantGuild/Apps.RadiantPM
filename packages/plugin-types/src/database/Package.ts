interface BasePackage {
    /**
     * The name of this package that is used in package managers
     */
    slug: string;

    /**
     * The display name of this package
     */
    name: string;

    /**
     * A short single-line description of the package
     */
    description: string;

    /**
     * The ID of the package manager that this feed is for, e.g. npm or nuget
     */
    type: string;
}

export interface SimplePackage extends BasePackage {
    /**
     * The number of versions that this package has
     */
    versionsCount: number;

    /**
     * The ID of the version to display as the latest (not necessarily the most
     * recent version as there might be e.g. experimental versions)
     */
    latestVersion: string | undefined;

    /**
     * The date that the most recent version was published (not necessarily the
     * "latest" version as there might be e.g. experimental versions)
     */
    lastUpdated: Date | undefined;
}

export type Package = BasePackage;
