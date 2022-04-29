import {RuntimeMetadata} from "@radiantpm/plugin-types";
import {
    Backend,
    Context,
    ContextWithPlugins,
    exit
} from "@radiantpm/runtime-bootstrap/runtime";
import Koa from "koa";
import {name, version} from "../package.json";
import {
    e,
    enableRequestLoggingKey,
    middlewarePluginsKey,
    requestLoggerKey,
    runExpressMiddlewareSymbol,
    runMiddlewareKey
} from "./constants";
import handleRequest from "./handleRequest";
import runMiddleware from "./runMiddleware";

async function getPort(context: Context) {
    const value = await context.readRequiredConfig(
        "port",
        "The port that the backend will be hosted on"
    );

    const int = parseInt(value);

    if (Number.isNaN(int) || int < 1 || int > 65535) {
        exit(e.ERROR_INVALID_PORT);
    }

    return int;
}

async function getHost(context: Context) {
    return await context.readOptionalConfig("host", "0.0.0.0");
}

async function getReqLoggingEnabled(context: Context) {
    const value = await context.readOptionalConfig(
        "enable_request_logging",
        "0"
    );

    return ["1", "true", "yes"].includes(value?.toLowerCase());
}

const backend: Backend = {
    name,
    version,
    errorCodes: e,
    async getMetaData(context: Context): Promise<RuntimeMetadata["data"]> {
        return {
            std01: {
                host: await getHost(context),
                port: await getPort(context),
                runExpressMiddlewareSymbol
            }
        };
    },
    async listen(context: ContextWithPlugins): Promise<void> {
        const logger = context.getLogger();

        const app = new Koa();

        app.context[enableRequestLoggingKey] = await getReqLoggingEnabled(
            context
        );

        app.context[requestLoggerKey] = context.getLogger("request");

        app.context[middlewarePluginsKey] = context.getMiddlewarePlugins();

        app.context[runMiddlewareKey] = runMiddleware.bind(null, context);

        logger.trace("Adding request handler");
        app.use(handleRequest);

        logger.trace("Loading web server configuration");
        const [port, host] = await Promise.all([
            getPort(context),
            getHost(context)
        ]);

        logger.debug("Starting HTTP listener");
        await new Promise<void>(yay => app.listen(port, host as never, yay));

        logger.info("Listening at %s:%s", host, port);
    }
};

export default backend;
