interface BaseVersion {
    /**
     * The identifier for this version (e.g. `1.2.3`). Should not contain the `v`.
     */
    slug: string;

    /**
     * A short few-word description of what changed in this version
     */
    description: string;

    /**
     * The date that this version was uploaded
     */
    creationDate: Date;
}

export type SimpleVersion = BaseVersion;

export interface Version extends BaseVersion {
    /**
     * The tags that the user gave to this version. Usually a version can be
     * installed by specifying these instead of a version number, so it could be
     * something like `latest` or `rc`. Not all package managers support this.
     *
     * The `latest` tag has special meaning as it is the default if one is not
     * specified, and it is what is displayed if no version is specified in
     * the UI.
     */
    tags: string[];

    /**
     * The hash of this version's file that was given when the file was uploaded
     */
    assetHash: string;

    /**
     * The source of the asset's readme. Usually markdown or plain text
     */
    readme: string;

    /**
     * The format that the readme is in. A frontend may give a list of supported
     * types, e.g. in `serverData.stdfe01.documentFormats` for. If in doubt, or
     * if a type is not supported, use the value `"plain"`.
     */
    readmeType: "plain" | string;
}
