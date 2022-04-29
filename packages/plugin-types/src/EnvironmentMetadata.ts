import Plugin from "./Plugin";
import {AuthenticationPlugin} from "./authentication";
import {DatabasePlugin} from "./database";
import {FileCategory, StoragePlugin} from "./storage";
import {ValidationPlugin} from "./validation";

export interface RuntimeMetadata {
    /**
     * The name of this runtime library.
     *
     * This should not be used for compatibility checking, it is here for debugging purposes.
     */
    name: string;

    /**
     * The version of the runtime library.
     *
     * This should not be used for compatibility checking, it is here for debugging purposes.
     */
    version: string;

    /**
     * Data about the runtime library.
     *
     * The object's keys are the name and major version of the runtime library (e.g. `std01`),
     * and the value is some data that the runtime library can set for plugins to access.
     * A runtime library can also specify other keys for different servers with compatible values,
     * to support plugins that only support that server type.
     *
     * **Important:** Any changes (additions included)
     * to the data specific to your runtime library must be counted as a major change,
     * as it is an interface that other runtime libraries can fill.
     */
    data: Record<string, unknown>;
}

export interface SelectedPlugins {
    authentication: AuthenticationPlugin;
    database: DatabasePlugin;
    storage: {
        [Category in FileCategory]: StoragePlugin;
    };
    validation: ValidationPlugin;
}

export default interface EnvironmentMetadata {
    /**
     * Metadata about the plugin loader
     */
    pluginLoader: RuntimeMetadata;

    /**
     * Metadata about the plugin selector
     */
    pluginSelector: RuntimeMetadata;

    /**
     * Metadata about the backend
     */
    backend: RuntimeMetadata;

    /**
     * The plugins that have been selected for each plugin type that requires selection
     */
    selectedPlugins: SelectedPlugins;

    /**
     * A list of plugins that the server has loaded, in the load order
     */
    plugins: readonly Plugin[];
}
