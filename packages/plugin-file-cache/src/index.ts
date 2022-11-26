import {createHash} from "crypto";
import {mkdir, readFile, unlink, writeFile} from "fs/promises";
import {dirname, join} from "path";
import {createLogger} from "@radiantpm/log";
import {
    CachePlugin,
    CacheSetOptions,
    PluginExport
} from "@radiantpm/plugin-types";
import {readMetadata, writeMetadata} from "./metadata";

const logger = createLogger("plugin-file-cache");

interface Configuration {
    directory: string;
}

function getFilePath(configuration: Configuration, key: string) {
    const hash = createHash("sha256").update(key).digest("hex");
    return join(configuration.directory, hash.substring(0, 2), hash);
}

// TODO: move to a background job, and automatically do it every so often too
async function cleanCachedValue(configuration: Configuration, key: string) {
    await unlink(getFilePath(configuration, key));
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    provides: {
        cache: "file-cache"
    },
    init(configuration): CachePlugin {
        return {
            type: "cache",
            id: "file-cache",
            async set(key, value, options: CacheSetOptions = {}) {
                logger.trace({options}, "SET %s", key);

                const path = getFilePath(configuration, key);
                await mkdir(dirname(path), {recursive: true});

                await Promise.all([
                    writeFile(path, value),
                    writeMetadata(path, options)
                ]);
            },
            async get(key) {
                const path = getFilePath(configuration, key);

                try {
                    const [cachedValue, metadata] = await Promise.all([
                        await readFile(path),
                        await readMetadata(path)
                    ]);

                    if (metadata.expiryUnixTime < Date.now()) {
                        logger.trace("GET %s: expired", key);
                        await cleanCachedValue(configuration, key);
                        return null;
                    }

                    logger.trace("GET %s: successful", key);
                    return cachedValue;
                } catch (error) {
                    if ("code" in error && error.code === "ENOENT") {
                        logger.trace("GET %s: not found", key);
                        return null;
                    } else {
                        logger.trace(error, "GET %s: failed", key);
                        throw error;
                    }
                }
            }
        };
    },
    configSchema: {
        type: "object",
        additionalProperties: false,
        required: ["directory"],
        properties: {
            directory: {
                type: "string"
            }
        }
    }
};

export default pluginExport;
