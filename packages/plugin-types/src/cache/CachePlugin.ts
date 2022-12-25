import PluginBase from "../PluginBase";
import CacheSetOptions from "./CacheSetOptions";

export default interface CachePlugin extends PluginBase<"cache"> {
    /**
     * An identifier for this plugin, which is local to a `PluginExport`.
     */
    id: string;

    /**
     * Writes a value to the cache, identified by the key.
     * @param key The key to cache the value under. To interact with the value again, use this key.
     * @param value The value to write to the cache, that will be returned if you read from it again.
     * @param options Various options to change how the cache is written or read
     */
    set(key: string, value: Buffer, options?: CacheSetOptions): Promise<void>;

    /**
     * Reads the value that was set using `set(key)`.
     * @param key The same key as was used in the `set` call.
     * @returns The cached value, or null if there was none.
     */
    get(key: string): Promise<Buffer | null>;
}
