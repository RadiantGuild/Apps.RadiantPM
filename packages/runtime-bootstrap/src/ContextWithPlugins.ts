import {
    AuthenticationPlugin,
    DatabasePlugin,
    FileCategory,
    MiddlewarePlugin,
    Plugin,
    StoragePlugin, ValidationPlugin
,CachePlugin} from "@radiantpm/plugin-types";
import Context from "./Context";

export default interface ContextWithPlugins extends Context {
    /**
     * Returns a list of every plugin that has been loaded, in the order that they were loaded
     */
    getPlugins(): readonly Plugin[];

    /**
     * Returns all the middleware plugins that have been loaded, in the correct order
     */
    getMiddlewarePlugins(): readonly MiddlewarePlugin[];

    /**
     * Returns the database plugin that an export with the specified name provides.
     * Throws an error if there is no export with the provided name, or the export does not provide a database plugin.
     */
    getDatabasePlugin(exportName: string): DatabasePlugin;

    /**
     * Returns the authentication plugin that an export with the specified name provides.
     * Throws an error if there is no export with the provided name, or the export does not provide an authentication plugin.
     */
    getAuthenticationPlugin(exportName: string): AuthenticationPlugin;

    /**
     * Returns the storage plugin that an export with the specified name provides for the specified category.
     * Throws an error if there is no export with the provided name,
     * or the export does not provide a storage plugin for the specified category.
     */
    getStoragePlugin(
        exportName: string,
        assetCategory: FileCategory
    ): StoragePlugin;

    /**
     * Returns the validation plugin that an export with the specified name provides.
     * Throws an error if there is no export with the provided name, or the export does not provide an authentication plugin.
     */
    getValidationPlugin(exportName: string): ValidationPlugin;

    /**
     * Returns the cache plugin that an export with the specified name provides.
     * Throws an error if there is no export with the provided name, or the export does not provide a validation plugin.
     */
    getCachePlugin(exportName: string): CachePlugin;

    /**
     * Returns the name of the `PluginExport` that owns this plugin
     */
    getExportNameFromPlugin(plugin: Plugin): string;
}
