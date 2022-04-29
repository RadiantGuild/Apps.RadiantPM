import {createLogger} from "@radiantpm/log";
import Ajv from "ajv";
import {PluginInfo} from "./PluginInfo";
import {e} from "./constants";
import {exit} from "./exit";

const logger = createLogger("runtime-bootstrap:config-validator");

export default function validateConfig<T>(
    ajv: Ajv,
    info: PluginInfo,
    config: unknown
): asserts config is T {
    if (info.export.validateConfig && info.export.configSchema) {
        logger.fatal("Invalid plugin %s: only one of `configSchema` or `validateConfig` may be defined", info.name);
        exit(e.ERROR_MULTIPLE_VALIDATION_METHODS);
    }

    if (info.export.validateConfig) {
        const isValid = info.export.validateConfig(config);

        if (!isValid) {

            throw new Error(
                `Configuration provided for ${info.name} is invalid`
            );
        }
    } else if (info.export.configSchema) {
        const validate = ajv.compile<T>(info.export.configSchema);
        const isValid = validate(config);

        if (!isValid) {
            const errorList = validate.errors
                ?.map(err => err.message)
                .join(", ");
            throw new Error(
                `Configuration provided for ${info.name} is invalid: ${errorList}`
            );
        }
    }
}
