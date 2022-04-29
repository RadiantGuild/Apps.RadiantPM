import {RpmLogger} from "@radiantpm/log";

export default interface Context {
    /**
     * Reads a configuration value.
     * If it is not defined, an error will be thrown.
     *
     * @param key The name of the configuration value, using underscore-separated words.
     * This value will be converted to the various cases for the different places that the configuration can be set.
     *
     * @param description A short description of the configuration value.
     * If an error is thrown, this message will be displayed.
     */
    readRequiredConfig(key: string, description: string): Promise<string>;

    /**
     * Reads a configuration value.
     * If it is not defined, `undefined` will be returned.
     *
     * @param key The name of the configuration value, using underscore-separated words.
     * This value will be converted to the various cases for the different places that the configuration can be set.
     */
    readOptionalConfig(key: string): Promise<string | undefined>;

    /**
     * Reads a configuration value.
     * If it is not defined, the value passed to `def` will be returned.
     *
     * @param key The name of the configuration value, using underscore-separated words.
     * This value will be converted to the various cases for the different places that the configuration can be set.
     *
     * @param def The default value to return if a value is not provided by the user
     */
    readOptionalConfig(key: string, def: string): Promise<string>;

    /**
     * Returns a logger with the name based on this runtime library's name
     * @param name An optional sub-name, which will be added to the runtime library's name, separated with a colon
     */
    getLogger(name?: string): RpmLogger;
}
