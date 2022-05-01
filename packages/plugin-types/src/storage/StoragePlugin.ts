import PluginBase from "../PluginBase";
import type {FileCategory} from "./FileCategory";

export interface AssetUrlParams {
    /**
     * The identifier for this asset
     */
    id: string;

    /**
     * The category that this asset is a part of
     */
    category: FileCategory;
}

export default interface StoragePlugin extends PluginBase<"storage"> {
    /**
     * An identifier for this plugin, which is local to a `PluginExport`.
     */
    id: string;

    /**
     * The URL that the asset is hosted at. Can be a redirect if needed. Passed
     * parameters `category` (one of `FileCategory`), and `id` (a hash or some
     * other identifier). Can be either URL parameters (use `[]` notation) or
     * query parameters by default.
     */
    assetUrl: string;

    /**
     * Write a file to the storage
     * @param category The type of file this is
     * @param id The id of the file
     * @param content The contents of the file
     */
    write(category: FileCategory, id: string, content: Buffer): void | Promise<void>;

    /**
     * Read the contents of a file from storage
     * @param category The type of file this is
     * @param id The id of the file
     */
    read(category: FileCategory, id: string): Buffer | Promise<Buffer>;

    /**
     * Hashes the file with the specified method. If the method isn't supported, an error should be thrown.
     *
     * The output encoding is hexadecimal, if another encoding is needed the result can be converted.
     */
    hash(method: string, category: FileCategory, id: string): Promise<string>;
}
