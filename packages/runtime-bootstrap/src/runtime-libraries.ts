import {
    AuthenticationPlugin,
    CachePlugin,
    DatabasePlugin,
    FileCategory,
    RuntimeMetadata,
    StoragePlugin,
    ValidationPlugin
} from "@radiantpm/plugin-types";
import Context from "./Context";
import ContextWithPlugins from "./ContextWithPlugins";
import {ExtendedPluginInfo} from "./PluginInfo";

export const runtimeLibraryTypes: ReadonlySet<string> = new Set([
    "plugin-loader",
    "plugin-selector",
    "backend"
]);

export interface RuntimeLibrary {
    /**
     * The name of this runtime library, e.g. from the `package.json` file
     */
    name: string;

    /**
     * The version of this runtime library, e.g. from the `package.json` file
     */
    version: string;

    /**
     * Error codes and their names, which will be logged along with the code if it causes an exit.
     *
     * @see Context.exit
     */
    errorCodes?: Record<string, number>;

    /**
     * Gets the `data` part of the metadata object for this runtime library that plugins can access via the `onMetaLoaded`
     * method
     */
    getMetaData(
        context: Context
    ): RuntimeMetadata["data"] | Promise<RuntimeMetadata["data"]>;
}

/**
 * Discovers and imports plugins
 */
export interface PluginLoader extends RuntimeLibrary {
    /**
     * Searches for plugins and loads their `PluginExport`s.
     * Should not interact any further with the plugins.
     *
     * @param context Context specific to this runtime library, and some useful methods
     */
    getPluginExports(context: Context): Promise<ExtendedPluginInfo[]>;
}

/**
 * Selects the specific plugin that will be used, for plugin types that do not support multiple at once
 */
export interface PluginSelector extends RuntimeLibrary {
    /**
     * Returns the database plugin that the application will use
     * @param context Context specific to this runtime library, and some useful methods
     */
    selectDatabasePlugin(context: ContextWithPlugins): Promise<DatabasePlugin>;

    /**
     * Returns the authentication plugin that the application will use
     * @param context Context specific to this runtime library, and some useful methods
     */
    selectAuthenticationPlugin(
        context: ContextWithPlugins
    ): Promise<AuthenticationPlugin>;

    /**
     * Returns the storage plugin that the application will use for the asset category that is specified
     *
     * @param context Context specific to this runtime library, and some useful methods
     *
     * @param assetCategory The asset category that this selection is for.
     * If the storage plugin that is returned does not support the specified asset category,
     * no error will be immediately thrown but issues will happen.
     */
    selectStoragePlugin(
        context: ContextWithPlugins,
        assetCategory: FileCategory
    ): Promise<StoragePlugin>;

    /**
     * Returns the validation plugin that the application will use
     * @param context Context specific to this runtime library, and some useful methods
     */
    selectValidationPlugin(
        context: ContextWithPlugins
    ): Promise<ValidationPlugin>;

    selectCachePlugin(context: ContextWithPlugins): Promise<CachePlugin>;
}

export interface Backend extends RuntimeLibrary {
    /**
     * Starts listening for requests which will be run through the middleware
     *
     * @returns A promise that resolves when the server is listening
     */
    listen(context: ContextWithPlugins): Promise<void>;
}
