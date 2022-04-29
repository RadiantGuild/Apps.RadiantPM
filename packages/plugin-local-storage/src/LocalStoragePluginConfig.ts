export default interface LocalStoragePluginConfig {
    /**
     * The physical path to store the files at
     */
    hostPath: string;

    /**
     * The base URL for requests. Must start with /. Defaults to `/-/storage/`.
     */
    baseUrl?: `/${string}`;
}
