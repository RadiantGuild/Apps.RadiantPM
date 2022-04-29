import assert from "assert";
import {
    AuthenticationPlugin,
    DatabasePlugin,
    FileCategory,
    MiddlewarePlugin,
    Plugin,
    StoragePlugin, ValidationPlugin
} from "@radiantpm/plugin-types";
import ContextImpl from "./ContextImpl";
import ContextWithPlugins from "./ContextWithPlugins";
import ExtendedPlugin from "./ExtendedPlugin";
import {PluginInfo} from "./PluginInfo";
import PrefilledVariableReader from "./variable-readers/PrefilledVariableReader";

type PluginWithId = Extract<Plugin, {id: string}>;
type PluginOfType<Type extends Plugin["type"]> = Extract<Plugin, {type: Type}>;

function assertProvides(
    targetPlugin: string | undefined,
    pluginExportName: string,
    provisionName: string
): asserts targetPlugin is string {
    if (targetPlugin) return;

    throw new Error(
        `Plugin \`${pluginExportName}\` does not provide ${provisionName}`
    );
}

function assertHasPlugin(
    plugin: ExtendedPlugin | undefined,
    targetPlugin: string,
    pluginExportName: string,
    provisionName: string
): asserts plugin is ExtendedPlugin {
    if (plugin) return;

    throw new Error(
        `Plugin ${pluginExportName} specifies an invalid ${provisionName} provider \`${targetPlugin}\`. This is a bug in ${pluginExportName}, please report it to its authors.`
    );
}

export default class ContextWithPluginsImpl extends ContextImpl implements ContextWithPlugins {
    private readonly exportNameMapping = new Map<Plugin, string>();

    constructor(
        loggerName: string,
        private readonly plugins: readonly ExtendedPlugin[],
        private readonly pluginInfos: readonly PluginInfo[],
        jsonPath?: PrefilledVariableReader,
        runtimeType?: string
    ) {
        super(loggerName, jsonPath, runtimeType);
        this.setupExportNameMapping();
    }

    getAuthenticationPlugin(exportName: string): AuthenticationPlugin {
        const pluginExport = this.getPluginInfoByName(exportName);
        const targetPlugin = pluginExport.export.provides?.authentication;

        assertProvides(targetPlugin, pluginExport.name, "authentication");

        const plugin = this.findPlugin(
            "authentication",
            pluginExport.name,
            targetPlugin
        );

        assertHasPlugin(
            plugin,
            targetPlugin,
            pluginExport.name,
            "authentication"
        );

        return plugin.plugin;
    }

    getDatabasePlugin(exportName: string): DatabasePlugin {
        const pluginExport = this.getPluginInfoByName(exportName);
        const targetPlugin = pluginExport.export.provides?.database;

        assertProvides(targetPlugin, pluginExport.name, "database");

        const plugin = this.findPlugin(
            "database",
            pluginExport.name,
            targetPlugin
        );

        assertHasPlugin(plugin, targetPlugin, pluginExport.name, "database");

        return plugin.plugin;
    }

    getValidationPlugin(exportName: string): ValidationPlugin {
        const pluginExport = this.getPluginInfoByName(exportName);
        const targetPlugin = pluginExport.export.provides?.validation;

        assertProvides(targetPlugin, pluginExport.name, "validation");

        const plugin = this.findPlugin(
            "validation",
            pluginExport.name,
            targetPlugin
        );

        assertHasPlugin(plugin, targetPlugin, pluginExport.name, "validation");

        return plugin.plugin;
    }

    getStoragePlugin(
        exportName: string,
        assetCategory: FileCategory
    ): StoragePlugin {
        const pluginExport = this.getPluginInfoByName(exportName);

        const storageProvision = pluginExport.export.provides?.storage ?? {};
        const targetPlugin = storageProvision[assetCategory];

        const provisionName = `storage for ${assetCategory}`;

        assertProvides(targetPlugin, pluginExport.name, provisionName);

        const plugin = this.findPlugin(
            "storage",
            pluginExport.name,
            targetPlugin
        );

        assertHasPlugin(plugin, targetPlugin, pluginExport.name, provisionName);

        return plugin.plugin;
    }

    getMiddlewarePlugins(): readonly MiddlewarePlugin[] {
        return this.plugins
            .map(({plugin}) => plugin)
            .filter(
                plugin => plugin.type === "middleware"
            ) as MiddlewarePlugin[];
    }

    getPlugins(): readonly Plugin[] {
        return this.plugins.map(pl => pl.plugin);
    }

    getExportNameFromPlugin(plugin: Plugin): string {
        const name = this.exportNameMapping.get(plugin);
        assert(name, "Plugin is missing from export name mapping");
        return name;
    }

    private setupExportNameMapping() {
        for (const plugin of this.plugins) {
            this.exportNameMapping.set(plugin.plugin, plugin.ownerName);
        }
    }

    private getPluginInfoByName(name: string) {
        const info = this.pluginInfos.find(pl => pl.name === name);

        assert(info, `No plugin is defined with the name \`${name}\``);

        return info;
    }

    private findPlugin<Type extends PluginWithId["type"]>(
        type: Type,
        exportName: string,
        pluginId: string
    ): ExtendedPlugin<PluginOfType<Type>> | undefined {
        return this.plugins.find(
            pl =>
                pl.plugin.type === type &&
                pl.ownerName === exportName &&
                pl.plugin.id === pluginId
        ) as ExtendedPlugin<PluginOfType<Type>>;
    }
}
