import type {JSONSchemaType} from "ajv";
import EnvironmentMetadata from "./EnvironmentMetadata";
import Plugin from "./Plugin";
import {FileCategory} from "./storage";

/**
 * This load order will apply to every plugin
 */
type WildcardLoadConstraint = "*";

/**
 * This load order will apply to any plugin with the specified scope
 */
type ScopeWildcardLoadConstraint = `@${string}/*`;

/**
 * This load order will apply to a specific plugin
 */
type SpecificOrderConstraint = string;

type AllOrderConstraints =
    | WildcardLoadConstraint
    | ScopeWildcardLoadConstraint
    | SpecificOrderConstraint;

export type OrderConstraintItem =
    | AllOrderConstraints
    | {constraint: AllOrderConstraints; required: true};

export type OrderConstraint = OrderConstraintItem | OrderConstraintItem[];

export interface PluginProvision {
    /**
     The ID of the plugin that provides authentication
     */
    authentication?: string;

    /**
     The ID of the plugin that provides a database
     */
    database?: string;

    /**
     The ID of the plugins that provide storage
     */
    storage?: {
        [Key in FileCategory]?: string;
    };

    /**
     * The ID of the plugin that provides validation
     */
    validation?: string;

    /**
     * The ID of the plugin that provides caching
     */
    cache?: string;
}

/**
 * The default export of a plugin must have this type.
 */
export default interface PluginExport<
    Config,
    ConfigIsRequired extends boolean
> {
    /**
     * Sets whether the user must specify a configuration object
     */
    configIsRequired: ConfigIsRequired;

    /**
     * An alternative to `validateConfig`, allows you to specify a JSON schema instead.
     * Setting this property is recommended if possible instead of `validateConfig`, as it provides better error
     * messages for the user.
     */
    configSchema?: JSONSchemaType<Config>;

    /**
     * Specifies what this plugin can provide, and the IDs of those plugins
     * @example Package & static assets as separate plugins
     * init() => [
     *     {
     *         type: "storage",
     *         id: "package-provider"
     *     },
     *     {
     *         type: "storage",
     *         id: "static-asset-provider"
     *     }
     * ];
     * provides: {
     *     storage: {
     *         package: "package-provider",
     *         staticAsset: "static-asset-provider"
     *     }
     * };
     */
    provides?: PluginProvision;

    /**
     * Sets the plugins that this one should load before, using the names defined in their `package.json`. Circular
     * dependencies will result in an error.
     *
     * If you want to load before every plugin, use the value `"*"`. This value has a lower priority than a specific
     * plugin name, so if there is a circular dependency the other one will win.
     *
     * You can also load before all plugins in a specific scope, using the format `@scope/*`. This specifier has a
     * lower priority than a specific plugin name, and a higher priority than a wildcard.
     *
     * @remarks `loadAfter` has a higher priority than `loadBefore`, so if a value matches both, the plugin will load after it.
     */
    loadBefore?: OrderConstraint;

    /**
     * Sets the plugins that this one should load after, using the names defined in their `package.json`. Circular
     * dependencies will result in an error.
     *
     * If you want to load after every plugin, use the value `"*"`. This value has a lower priority than a specific
     * plugin name, so if there is a circular dependency the other one will win.
     *
     * You can also load after all plugins in a specific scope, using the format `@scope/*`. This specifier has a
     * lower priority than a specific plugin name, and a higher priority than a wildcard.
     *
     * @remarks `loadAfter` has a higher priority than `loadBefore`, so if a value matches both, the plugin will load after it.
     */
    loadAfter?: OrderConstraint;

    /**
     * Creates the plugin instance based on some passed configuration
     * @param config Configuration object passed by the user. Has already been validated by `validateConfig`.
     */
    init(
        config: ConfigIsRequired extends true ? Config : Config | null
    ): Plugin | Plugin[] | Promise<Plugin | Plugin[]>;

    /**
     * Called after every plugin is initialised, with metadata about the environment
     */
    onMetaLoaded?(meta: EnvironmentMetadata): void;

    /**
     * Validates the configuration and returns if it is OK or not.
     * @param config The configuration object to validate. If it is valid, it will be passed into `init`.
     */
    validateConfig?(config: unknown): config is Config;
}
