import {createLogger} from "@radiantpm/log";
import {CachePlugin, PluginExport} from "@radiantpm/plugin-types";
import Redis from "ioredis";

const logger = createLogger("plugin-redis-cache");

interface Configuration {
    connection: string;
    namespace?: string;
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["connection"],
        properties: {
            connection: {
                type: "string"
            },
            namespace: {
                type: "string",
                nullable: true
            }
        }
    },
    provides: {
        cache: "redis-cache"
    },
    init(configuration): CachePlugin {
        logger.debug("Connecting to Redis server");

        const redis = new Redis(configuration.connection, {
            keyPrefix: configuration.namespace,
            enableReadyCheck: true
        });

        redis.on("connect", () => {
            logger.debug("Connected to Redis server")
        });

        redis.on("ready", () => {
            logger.debug("Redis server indicates that it is ready");
        });

        redis.on("reconnecting", () => {
            logger.warn("Disconnected, attempting to reconnect");
        });

        return {
            type: "cache",
            id: "redis-cache",
            async set(key, value, options) {
                if (options?.expireInSeconds) {
                    await redis.set(key, value, "EX", options.expireInSeconds);
                } else {
                    await redis.set(key, value);
                }
            },
            get(key) {
                return redis.getBuffer(key);
            }
        };
    }
};

export default pluginExport;
