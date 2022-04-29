import {
    MiddlewareError,
    MiddlewareNextFunction,
    MiddlewarePlugin,
    RequestContext
} from "@radiantpm/plugin-types";
import {RpmLogger} from "@radiantpm/runtime-bootstrap";
import {ContextWithPlugins} from "@radiantpm/runtime-bootstrap/dist/runtime";

const handledErrorMarker = Symbol("handled error");

interface HandledError {
    [handledErrorMarker]: true;
}

function hasBeenHandled(
    error: MiddlewareError
): error is MiddlewareError & HandledError {
    const casted = error as MiddlewareError & HandledError;
    return !!casted[handledErrorMarker];
}

function markHandled(
    error: MiddlewareError
): asserts error is MiddlewareError & HandledError {
    const casted = error as MiddlewareError & HandledError;
    casted[handledErrorMarker] = true;
}

async function runMiddlewareImpl(
    context: ContextWithPlugins,
    requestContext: RequestContext,
    plugins: MiddlewarePlugin[],
    logger: RpmLogger,
    index: number
): Promise<MiddlewareError | undefined> {
    // don't continue if the request has been aborted
    if (requestContext.req.signal.aborted) return;

    const plugin = plugins[index];
    const pluginExportName = context.getExportNameFromPlugin(plugin);

    let hasRunNext = false;

    const runNext = (async opts => {
        if (hasRunNext) {
            throw new Error("`next()` has been called multiple times");
        }

        hasRunNext = true;

        // do nothing if there are no plugins left to run
        const error = await (index >= plugins.length - 1
            ? Promise.resolve()
            : runMiddlewareImpl(
                  context,
                  requestContext,
                  plugins,
                  logger,
                  index + 1
              ));

        if (error) {
            if (opts?.returnError) return error;
            throw error;
        } else {
            return;
        }
    }) as MiddlewareNextFunction;

    try {
        await plugin.handle(requestContext, runNext);
    } catch (err) {
        const errAsError = (
            err instanceof Error ? err : new Error(err)
        ) as MiddlewareError;

        if (hasBeenHandled(errAsError)) {
            const name = plugin.name
                ? `${plugin.name} from ${pluginExportName}`
                : `a middleware plugin in ${pluginExportName}`;

            logger.trace(
                "Handler for %s caught an error from  the next middleware up. " +
                    "It will bubble up until either it is handled by middleware or the backend runtime.",
                name
            );

            return errAsError;
        }

        if (plugin.name) {
            logger.trace(
                "Plugin %s from %s threw a %s",
                plugin.name,
                pluginExportName,
                errAsError.name
            );
        } else {
            logger.trace(
                "Plugin from %s threw a %s",
                pluginExportName,
                errAsError.name
            );
        }

        // add some details for middleware that handle errors
        errAsError.pluginExportName = pluginExportName;
        errAsError.pluginName = plugin.name;
        errAsError.isMessageSensitive ??= false;

        // but don't override it if we have already set it
        markHandled(errAsError);

        return errAsError;
    }

    return;
}

export default async function runMiddleware(
    context: ContextWithPlugins,
    requestContext: RequestContext,
    plugins: MiddlewarePlugin[]
): Promise<void> {
    const logger = context.getLogger(
        `middleware:${requestContext.ctx.requestId}`
    );

    const error = await runMiddlewareImpl(
        context,
        requestContext,
        plugins,
        logger,
        0
    );
    if (error) throw error;
}
