import {
    AuthenticationPlugin,
    DatabasePlugin,
    FileCategory,
    RuntimeMetadata,
    StoragePlugin, ValidationPlugin
} from "@radiantpm/plugin-types";
import {
    ContextWithPlugins,
    exit,
    PluginSelector
} from "@radiantpm/runtime-bootstrap/runtime";
import {name, version} from "../package.json";
import {e} from "./constants";

function parseMulti(src: string): Map<string, string> {
    return new Map(
        src
            .split(";")
            .filter(Boolean)
            .map(pl => {
                const items = pl.split("=");
                if (items.length !== 2) exit(e.ERROR_INVALID_MULTI);
                return items;
            }) as [string, string][]
    );
}

const pluginSelector: PluginSelector = {
    name,
    version,
    errorCodes: e,
    async getMetaData(): Promise<RuntimeMetadata["data"]> {
        return {
            std01: {}
        };
    },
    async selectAuthenticationPlugin(
        context: ContextWithPlugins
    ): Promise<AuthenticationPlugin> {
        const pluginExportName = await context.readRequiredConfig(
            "auth_plugin",
            "Name of the authentication plugin export"
        );

        return context.getAuthenticationPlugin(pluginExportName);
    },
    async selectDatabasePlugin(
        context: ContextWithPlugins
    ): Promise<DatabasePlugin> {
        const pluginExportName = await context.readRequiredConfig(
            "database_plugin",
            "Name of the database plugin export"
        );

        return context.getDatabasePlugin(pluginExportName);
    },
    async selectStoragePlugin(
        context: ContextWithPlugins,
        assetCategory: FileCategory
    ): Promise<StoragePlugin> {
        const logger = context.getLogger();

        const storagePlugins = await context.readRequiredConfig(
            "storage_plugins",
            "Name of each asset category's storage plugin export, in the format [category]=[plugin];..."
        );

        const plugins = parseMulti(storagePlugins);
        const exportName = plugins.get(assetCategory);

        if (typeof exportName === "undefined") {
            logger.fatal(
                "Missing storage plugin for %s storage",
                assetCategory
            );
            exit(e.ERROR_MISSING_STORAGE_PLUGIN);
        }

        return context.getStoragePlugin(exportName, assetCategory);
    },
    async selectValidationPlugin(
        context: ContextWithPlugins
    ): Promise<ValidationPlugin> {
        const pluginExportName = await context.readRequiredConfig(
            "validation_plugin",
            "Name of the validation plugin export"
        );

        return context.getValidationPlugin(pluginExportName);
    }
};

export default pluginSelector;
