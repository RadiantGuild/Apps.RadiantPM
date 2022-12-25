import {createLogger} from "@radiantpm/log";
import {fileCategories, SelectedPlugins} from "@radiantpm/plugin-types";
import ContextImpl from "./ContextImpl";
import ContextWithPluginsImpl from "./ContextWithPluginsImpl";
import {ExtendedPluginInfo} from "./PluginInfo";
import {e, eNs} from "./constants";
import {exit, getExitErrorCode, isExitError} from "./exit";
import {handleMetaLoaded, initialisePlugins} from "./plugin-init";
import {
    buildDependencyTree,
    calculateLoadOrder,
    createPluginMap
} from "./plugin-sorting";
import {Backend, PluginLoader, PluginSelector} from "./runtime-libraries";
import getLoggerName from "./utils/getLoggerName";
import getMeta from "./utils/getMeta";
import EnvironmentVariableReader from "./variable-readers/EnvironmentVariableReader";
import PrefilledVariableReader from "./variable-readers/PrefilledVariableReader";

const logger = createLogger("runtime-bootstrap");

type RuntimeLibraryLoader<T> = Promise<{default: T}>;

export interface RuntimeLibraries {
    pluginLoader: () => RuntimeLibraryLoader<PluginLoader>;
    pluginSelector: () => RuntimeLibraryLoader<PluginSelector>;
    backend: () => RuntimeLibraryLoader<Backend>;
}

const definedErrorCodes = new Map<number, string>();

function log(msg: string) {
    console.log("runtime-bootstrap:", msg);
}

function loadErrorCodes(
    codes: Record<string, number>,
    nsMin: number,
    nsMax: number
) {
    const seenCodes = new Set<number>();

    for (const [name, code] of Object.entries(codes)) {
        if (seenCodes.has(code)) {
            log(`Invalid error code ${code}, seen before`);
            exit(e.ERROR_EXIT_CODE_DUPLICATED);
        }

        if (code < nsMin || code > nsMax) {
            log(`Invalid error code ${code}, not between ${nsMax}, ${nsMax}`);
            exit(e.ERROR_EXIT_CODE_OUT_OF_RANGE);
        }

        definedErrorCodes.set(code, name);
        seenCodes.add(code);
    }
}

loadErrorCodes(e, eNs.bootstrapperMin, eNs.bootstrapperMax);

async function bootstrapImplementation(runtimeLibraries: RuntimeLibraries) {
    logger.info("RadiantPM is booting");

    const startTime = process.hrtime.bigint();

    if (typeof runtimeLibraries !== "object") {
        exit(e.ERROR_RUNTIME_LIBS_INVALID);
    }

    const rootConfigReader = new EnvironmentVariableReader();

    const runtimeLibraryConfigDir = new PrefilledVariableReader(
        "runtime_config_dir",
        rootConfigReader
    );

    logger.debug("Importing plugin loader");

    if (typeof runtimeLibraries.pluginLoader !== "function") {
        logger.fatal("Plugin loader runtime library is not specified");
        exit(e.ERROR_RUNTIME_PLUGIN_LOADER_LOADER_INVALID);
    }

    const {default: pluginLoader} = await runtimeLibraries
        .pluginLoader()
        .catch(err => {
            if (isExitError(err)) throw err;

            logger.fatal(err, "Failed to load plugin-loader runtime library");
            exit(e.ERROR_RUNTIME_PLUGIN_LOADER_LOAD_FAILURE);
        });

    loadErrorCodes(
        pluginLoader.errorCodes ?? {},
        eNs.pluginLoaderMin,
        eNs.pluginLoaderMax
    );

    logger.trace("Creating plugin loader context");
    const pluginLoaderContext = new ContextImpl(
        getLoggerName(pluginLoader.name),
        runtimeLibraryConfigDir,
        "plugin-loader"
    );
    await pluginLoaderContext.init();

    logger.debug("Searching for plugin exports");
    const pluginInfos = await pluginLoader
        .getPluginExports(pluginLoaderContext)
        .catch(err => {
            if (isExitError(err)) throw err;

            logger.fatal(err, "Failed to get plugin exports");
            exit(e.ERROR_RUNTIME_PLUGIN_LOADER_GET_EXPORTS_FAILURE);
        });

    logger.debug("Calculating plugin load order");
    const pluginMap = createPluginMap(pluginInfos);

    logger.trace("Building the plugin dependency DAG");

    try {
        buildDependencyTree(pluginMap);
    } catch (err) {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to build the dependency DAG");
        exit(e.ERROR_PLUGIN_DAG_FAILURE);
    }

    logger.trace("Ordering the plugins");
    const orderedPlugins = await (async () =>
        calculateLoadOrder(pluginMap) as ExtendedPluginInfo[])().catch(err => {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to order the plugins");
        exit(e.ERROR_PLUGIN_ORDER_FAILURE);
    });

    logger.debug("Initialising the plugins");
    const loadedPlugins = await initialisePlugins(orderedPlugins).catch(err => {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to initialise the plugins");
        exit(e.ERROR_PLUGIN_INIT_FAILURE);
    });

    logger.debug("Importing plugin selector");

    if (typeof runtimeLibraries.pluginSelector !== "function") {
        logger.fatal("Plugin selector runtime library is not specified");
        exit(e.ERROR_RUNTIME_PLUGIN_SELECTOR_LOADER_INVALID);
    }

    const {default: pluginSelector} = await runtimeLibraries
        .pluginSelector()
        .catch(err => {
            if (isExitError(err)) throw err;

            logger.fatal(err, "Failed to load plugin-selector runtime library");
            exit(e.ERROR_RUNTIME_PLUGIN_SELECTOR_LOAD_FAILURE);
        });

    loadErrorCodes(
        pluginSelector.errorCodes ?? {},
        eNs.pluginSelectorMin,
        eNs.pluginSelectorMax
    );

    logger.trace("Creating plugin selector context");
    const pluginSelectorContext = new ContextWithPluginsImpl(
        getLoggerName(pluginLoader.name),
        loadedPlugins,
        orderedPlugins,
        runtimeLibraryConfigDir,
        "plugin-selector"
    );
    await pluginSelectorContext.init();

    if (
        typeof pluginSelector.selectAuthenticationPlugin !== "function" ||
        typeof pluginSelector.selectDatabasePlugin !== "function" ||
        typeof pluginSelector.selectStoragePlugin !== "function" ||
        typeof pluginSelector.selectValidationPlugin !== "function" ||
        typeof pluginSelector.selectCachePlugin !== "function"
    ) {
        logger.fatal("Plugin selector does not expose a required method");
        exit(e.ERROR_RUNTIME_PLUGIN_SELECTOR_INVALID);
    }

    const [
        authenticationPlugin,
        databasePlugin,
        storagePluginEntries,
        validationPlugin,
        cachePlugin
    ] = await Promise.all([
        pluginSelector.selectAuthenticationPlugin(pluginSelectorContext),
        pluginSelector.selectDatabasePlugin(pluginSelectorContext),
        Promise.all(
            Array.from(fileCategories.values()).map(
                async category =>
                    [
                        category,
                        await pluginSelector.selectStoragePlugin(
                            pluginSelectorContext,
                            category
                        )
                    ] as const
            )
        ),
        pluginSelector.selectValidationPlugin(pluginSelectorContext),
        pluginSelector.selectCachePlugin(pluginSelectorContext)
    ]).catch(err => {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to select the plugins to use");
        exit(e.ERROR_RUNTIME_PLUGIN_SELECTOR_SELECT_FAILURE);
    });

    const selectedPlugins: SelectedPlugins = {
        authentication: authenticationPlugin,
        database: databasePlugin,
        storage: Object.fromEntries(
            storagePluginEntries
        ) as SelectedPlugins["storage"],
        validation: validationPlugin,
        cache: cachePlugin
    };

    logger.debug("Importing backend");

    if (typeof runtimeLibraries.backend !== "function") {
        logger.fatal("Backend runtime library is not specified");
        exit(e.ERROR_RUNTIME_BACKEND_LOADER_INVALID);
    }

    const {default: backend} = await runtimeLibraries.backend().catch(err => {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to load backend runtime library");
        exit(e.ERROR_RUNTIME_BACKEND_LOAD_FAILURE);
    });

    logger.trace("Creating backend context");
    const backendContext = new ContextWithPluginsImpl(
        getLoggerName(pluginLoader.name),
        loadedPlugins,
        orderedPlugins,
        runtimeLibraryConfigDir,
        "backend"
    );
    await backendContext.init();

    logger.debug(
        "Running environment metadata handlers for each plugin export"
    );

    const [pluginLoaderMeta, pluginSelectorMeta, backendMeta] =
        await Promise.all([
            getMeta(pluginLoader, pluginLoaderContext),
            getMeta(pluginSelector, pluginSelectorContext),
            getMeta(backend, backendContext)
        ]).catch(err => {
            if (isExitError(err)) throw err;

            logger.fatal(err, "Failed to get runtime metadata");
            exit(e.ERROR_GET_METADATA_FAILURE);
        });

    try {
        handleMetaLoaded(orderedPlugins, {
            plugins: loadedPlugins.map(({plugin}) => plugin),
            selectedPlugins,
            pluginLoader: pluginLoaderMeta,
            pluginSelector: pluginSelectorMeta,
            backend: backendMeta
        });
    } catch (err) {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Failed to call meta loaded handlers");
        exit(e.ERROR_META_LOAD_HANDLERS_FAILURE);
    }

    logger.debug("Initialising backend");

    try {
        await backend.listen(backendContext);
    } catch (err) {
        if (isExitError(err)) throw err;

        logger.fatal(err, "Error was thrown in backend");
        exit(e.ERROR_RUNTIME_BACKEND_FAILURE);
    }

    const endTime = process.hrtime.bigint();
    const bootTime = endTime - startTime;

    logger.info(
        {
            pluginCount: loadedPlugins.length,
            bootNs: bootTime.toString()
        },
        "Hello, world! Booting completed in %s milliseconds",
        bootTime / 1000000n
    );

    // As of now, we don't have a way to exit gracefully, so we will just wait forever
    await new Promise(() => {
        // never resolves
    });
}

async function errorHandledBootstrap(
    runtimeLibraries: RuntimeLibraries
): Promise<number> {
    try {
        await bootstrapImplementation(runtimeLibraries);
        return 0;
    } catch (err) {
        if (isExitError(err)) {
            return getExitErrorCode(err);
        }

        log(
            `An error was thrown and never caught:
${err.stack}`
        );
        return -1;
    }
}

/**
 * Bootstraps RadiantPM.
 * An object should be passed as the argument, with a key for each runtime library type,
 * whose value is a function that returns a promise with the runtime library.
 *
 * @example
 * bootstrap({
 *     pluginLoader: () => import("@radiantpm/runtime-standard-plugin-loader"),
 *     pluginSelector: () => import("@radiantpm/runtime-standard-plugin-selector"),
 *     backend: () => import("@radiantpm/runtime-standard-backend")
 * })
 *
 * @return The application exit code.
 * A non-zero value indicates an error.
 */
export default async function bootstrap(
    runtimeLibraries: RuntimeLibraries
): Promise<number> {
    const exitCode = await errorHandledBootstrap(runtimeLibraries);

    if (definedErrorCodes.has(exitCode)) {
        log(
            `exited with code ${exitCode} (${definedErrorCodes.get(exitCode)})`
        );
    } else {
        log(`exited with code ${exitCode}`);
    }

    return exitCode;
}
