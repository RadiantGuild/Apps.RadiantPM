import {existsSync} from "fs";
import {readdir, readFile, stat} from "fs/promises";
import {join, resolve} from "path";
import {RpmLogger} from "@radiantpm/log";
import {PluginExport, RuntimeMetadata} from "@radiantpm/plugin-types";
import {
    Context,
    exit,
    ExtendedPluginInfo,
    PluginLoader
} from "@radiantpm/runtime-bootstrap/runtime";
import JSON5 from "json5";
import {name, version} from "../package.json";
import {e} from "./constants";

async function getRootDirectory(context: Context) {
    return await context.readRequiredConfig(
        "plugin_root",
        "The directory that contains all the plugins"
    );
}

async function readPluginConfigs(
    context: Context
): Promise<Record<string, unknown>> {
    const logger = context.getLogger("config-reader");

    const source = await context.readRequiredConfig(
        "plugin_configs",
        "The JSON(5) configuration for the RadiantPM plugins"
    );

    try {
        // eslint-disable-next-line import/no-named-as-default-member
        return JSON5.parse(source ?? "{}");
    } catch (err) {
        logger.fatal(
            err,
            "Failed to read the plugin configs. The `plugin_configs` variable's value should be a JSON(5) object, not a path."
        );

        exit(e.ERROR_INVALID_PLUGIN_CONFIGS);
    }
}

function isModuleExport<T = unknown>(
    test: unknown
): test is PluginExport<T, boolean> {
    if (!test) return false;
    if (typeof test !== "object") return false;
    const asExport = test as PluginExport<T, boolean>;

    return typeof asExport.init === "function";
}

interface PluginPackage {
    name: string;
    main: string;
}

async function loadPluginInfoFromDir(
    logger: RpmLogger,
    configs: Record<string, unknown>,
    rootDirectory: string,
    pluginDir: string
): Promise<ExtendedPluginInfo | undefined> {
    const fullDir = resolve(rootDirectory, pluginDir);
    const info = await stat(fullDir);

    if (!info.isDirectory()) {
        logger.trace("Ignoring %s as it is not a directory", pluginDir);
        return;
    }

    logger.trace("Loading plugin from %s", fullDir);

    const packageJsonPath = join(fullDir, "package.json");

    if (!existsSync(packageJsonPath)) {
        logger.warn(
            "Ignoring plugin %s as it is missing its package.json file",
            pluginDir
        );
        return;
    }

    logger.trace("Reading plugin metadata from its package.json file");

    const packageJsonSource = await readFile(packageJsonPath, "utf8");

    // eslint-disable-next-line import/no-named-as-default-member
    const {name, main} = JSON5.parse(
        packageJsonSource
    ) as Partial<PluginPackage>;

    if (!name) {
        throw new Error(`Plugin in ${pluginDir} is missing the \`name\` field in its package.json.
This is an issue with the plugin - please report it to the plugin's authors.`);
    }

    if (!main) {
        throw new Error(`Plugin ${name} is missing the \`main\` field in its package.json.
This is an issue with the plugin - please report it to the plugin's authors.`);
    }

    const pluginEntrypointPath = join(fullDir, main);

    if (!existsSync(pluginEntrypointPath)) {
        throw new Error(`The entrypoint for the plugin ${name} does not exist.
This is an issue with the plugin - please report it to the plugin's authors.`);
    }

    logger.trace("Importing plugin entrypoint module");

    const {default: plugin} = await import(pluginEntrypointPath);

    if (!isModuleExport(plugin)) {
        throw new Error(`Plugin ${name} does not \`export default\` a PluginExport. Instead, a(n) ${typeof plugin} was found.
This is an issue with the plugin - please report it to the plugin's authors.`);
    }

    return {
        name,
        export: plugin,
        config: configs[name]
    };
}

const pluginLoader: PluginLoader = {
    name,
    version,
    errorCodes: e,
    async getMetaData(context: Context): Promise<RuntimeMetadata["data"]> {
        return {
            std01: {
                root: await getRootDirectory(context)
            }
        };
    },
    async getPluginExports(context: Context): Promise<ExtendedPluginInfo[]> {
        const logger = context.getLogger();

        const pluginRootDir = await getRootDirectory(context);
        const pluginDirectories = await readdir(pluginRootDir);

        const pluginConfigs = await readPluginConfigs(context);

        const infos = await Promise.all(
            pluginDirectories.map(
                loadPluginInfoFromDir.bind(
                    null,
                    logger,
                    pluginConfigs,
                    pluginRootDir
                )
            )
        ).catch(err => {
            logger.fatal(err, "Failed to load plugins");

            exit(e.ERROR_PLUGIN_LOAD_FAILED);
        });

        return infos.filter(Boolean) as ExtendedPluginInfo[];
    }
};

export default pluginLoader;
