export default interface GcsStoragePluginConfig {
    /**
     * The name of the bucket to put the files.
     */
    bucketName: string;

    /**
     * The base directory of any uploaded objects.
     */
    bucketBasePath?: string;

    /**
     * The path to the key.json file used to authenticate with GCS.
     *
     * Not required when RadiantPM is running on GCP, as Google handles it automatically.
     */
    keyFilename?: string;

    /**
     * The base URL for requests. Must start with /. Defaults to `/-/storage/`.
     */
    baseUrl?: `/${string}`;
}
