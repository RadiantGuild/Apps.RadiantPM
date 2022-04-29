import {createLogger} from "@radiantpm/log";
import {EnvironmentMetadata} from "@radiantpm/plugin-types";
import Ajv from "ajv";
import ExtendedPlugin from "./ExtendedPlugin";
import {ExtendedPluginInfo, PluginInfo} from "./PluginInfo";
import {e} from "./constants";
import {exit} from "./exit";
import validateConfig from "./validateConfig";

const logger = createLogger("runtime-bootstrap:plugin-init");

export async function initialisePlugins(
    pluginInfos: readonly ExtendedPluginInfo[]
):  Promise<ExtendedPlugin[]> {
    const initialisedPlugins: ExtendedPlugin[] = [];

    const ajv = new Ajv();

    logger.debug("Initialising each plugin in order");

    for (const info of pluginInfos) {
        logger.trace("Validating configuration for %s", info.name);

        if (
            info.export.configIsRequired &&
            typeof info.config === "undefined"
        ) {
            logger.fatal("Missing required configuration for plugin %s", info.name);
            exit(e.ERROR_REQUIRED_CONFIG_MISSING);
        } else if (typeof info.config !== "undefined") {
            validateConfig(ajv, info, info.config);
        }

        logger.trace("Initialising plugin %s", info.name);
        const metaPlugin = await info.export.init(info.config);

        const pluginList = Array.isArray(metaPlugin)
            ? metaPlugin
            : [metaPlugin];

        const extendedPlugins = pluginList.map(plugin => ({
            ownerName: info.name,
            plugin
        }));

        initialisedPlugins.push(...extendedPlugins);
    }

    return initialisedPlugins;
}

export function handleMetaLoaded(infos: PluginInfo[], meta: EnvironmentMetadata): void {
    logger.debug("Calling metadata callbacks for each plugin in order");

    for (const info of infos) {
        info.export.onMetaLoaded?.(meta);
    }
}
