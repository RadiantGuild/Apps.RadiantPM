import {
    AuthenticationPlugin, DatabasePlugin,
    SerialisableAuthenticationPlugin, SerialisableDatabasePlugin,
    SerialisableStoragePlugin,
    SerialisableValidationPlugin,
    StoragePlugin,
    ValidationPlugin,
    validationScopes
} from "@radiantpm/plugin-types";

function getSerialisableStoragePlugin(
    plugin: StoragePlugin
): SerialisableStoragePlugin {
    return {
        type: plugin.type,
        id: plugin.id,
        assetUrl: plugin.assetUrl
    };
}

function getSerialisableDatabasePlugin(plugin: DatabasePlugin): SerialisableDatabasePlugin {
    return {
        type: plugin.type,
        id: plugin.id,
        getPackageUrl: plugin.getPackageUrl,
        listFeedsUrl: plugin.listFeedsUrl,
        getFeedUrl: plugin.getFeedUrl,
        getVersionUrl: plugin.getVersionUrl,
        listPackagesFromFeedUrl: plugin.listPackagesFromFeedUrl,
        listVersionsFromPackageUrl: plugin.listVersionsFromPackageUrl
    };
}

function getSerialisableAuthenticationPlugin(
    plugin: AuthenticationPlugin
): SerialisableAuthenticationPlugin {
    return {
        type: plugin.type,
        id: plugin.id,
        displayName: plugin.displayName,
        checkUrl: plugin.checkUrl,
        hasValidAccessTokenUrl: plugin.hasValidAccessTokenUrl,
        isRequiredUrl: plugin.isRequiredUrl,
        loginChangedUrl: plugin.loginChangedUrl,
        loginUrl: plugin.loginUrl,
        logoutUrl: plugin.logoutUrl
    };
}

function getSerialisableValidationPlugin(
    plugin: ValidationPlugin
): SerialisableValidationPlugin {
    const scopeValidators = Object.fromEntries(
        Array.from(validationScopes).map(scope => [
            scope,
            plugin.getClientValidators
                ? plugin.getClientValidators(scope)
                : plugin.getValidators(scope)
        ])
    ) as SerialisableValidationPlugin["validators"];

    return {
        type: plugin.type,
        id: plugin.id,
        validators: scopeValidators
    };
}

type SupportedPluginTypes =
    | AuthenticationPlugin
    | DatabasePlugin
    | StoragePlugin
    | ValidationPlugin;

type SupportedSerialisablePluginTypes =
    | SerialisableAuthenticationPlugin
    | SerialisableDatabasePlugin
    | SerialisableStoragePlugin
    | SerialisableValidationPlugin;

type SupportedPluginTypeNames = SupportedPluginTypes["type"];
type ChosenPluginType<T extends SupportedPluginTypeNames> =
    SupportedPluginTypes & {type: T};
type ChosenSerialisablePlugin<T extends SupportedPluginTypeNames> =
    SupportedSerialisablePluginTypes & {type: T};

export default function getSerialisablePlugin<
    Type extends SupportedPluginTypeNames
>(plugin: ChosenPluginType<Type>): ChosenSerialisablePlugin<Type> {
    switch (plugin.type) {
        case "authentication":
            return getSerialisableAuthenticationPlugin(
                plugin as AuthenticationPlugin
            ) as ChosenSerialisablePlugin<Type>;
        case "database":
            return getSerialisableDatabasePlugin(plugin as DatabasePlugin) as ChosenSerialisablePlugin<Type>;
        case "storage":
            return getSerialisableStoragePlugin(
                plugin as StoragePlugin
            ) as ChosenSerialisablePlugin<Type>;
        case "validation":
            return getSerialisableValidationPlugin(
                plugin as ValidationPlugin
            ) as ChosenSerialisablePlugin<Type>;
        default:
            throw new Error("Invalid plugin type");
    }
}
