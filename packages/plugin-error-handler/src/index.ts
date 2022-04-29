import assert from "assert";
import {STATUS_CODES} from "http";
import {URLSearchParams} from "url";
import {createLogger} from "@radiantpm/log";
import {
    EnvironmentMetadata,
    MiddlewareNextFunction,
    MiddlewarePlugin,
    PluginExport,
    RequestContext
} from "@radiantpm/plugin-types";
import {
    getRouteMethod, getRouteTest,
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "@radiantpm/plugin-utils";
import {accepts, setError, setText} from "@radiantpm/plugin-utils/req-utils";
import Handlebars from "handlebars";
import {name, version} from "../package.json";
import prodErrorPageDesc from "./error-description-prod.html";
import errorPageSource from "./error.hbs";
import HttpError from "./http-error";
import {launchEditor} from "./launchEditor";

const logger = createLogger("plugin-error-handler");

logger.debug("Compiling error page template");
const fillErrorPage = Handlebars.compile(errorPageSource);

function checkIfHttpError(err: Error): err is HttpError {
    // we can't use instanceof because each plugin bundles its own version of
    // the HttpError class

    const casted = err as HttpError;

    return (
        typeof casted.status === "number" &&
        typeof casted.baseMessage === "string"
    );
}

const packages = new Map<string, string>();

function stackWithLinks(stack: string | undefined) {
    if (!stack) return stack;

    return stack.replace(
        /(?:file:\/\/)?(\/[^:\n]+):(\d+)(?::(\d+))?/g,
        (src, file, line, col) => {
            const params = new URLSearchParams({
                file,
                line,
                col
            });

            const link = `/-/error-handler/open-in-editor?${params}`;

            return `<a href="javascript:fetch('${link}')">${src}</a>`;
        }
    );
}

let middlewarePlugins: Set<MiddlewarePlugin> | undefined;

class ErrorHandler implements MiddlewarePlugin {
    type: "middleware" = "middleware";

    [context: symbol]: unknown;

    async handle(
        ctx: RequestContext,
        next: MiddlewareNextFunction
    ): Promise<void> {
        const error = await next({
            returnError: true
        });

        if (error) {
            const isHttpError = checkIfHttpError(error);

            const status = isHttpError ? error.status : 500;
            const statusMessage = STATUS_CODES[status];

            const originalMessage = error.message;

            const message = error.isMessageSensitive
                ? `${status} ${statusMessage}`
                : isHttpError
                ? error.baseMessage
                : error.message;

            error.message = message;

            const replacedSectionLength = `${error.name}: ${originalMessage}
`.length;

            // replace the original error message in the stack trace
            // reading the stack is expensive but Pino will do it anyway
            if (error.stack) {
                error.stack = `${error.name}: ${message}
${error.stack.substring(replacedSectionLength)}`;
            }

            if (status >= 500 && status < 600) {
                logger.error(
                    error,
                    "An error occurred while running %s",
                    error.pluginExportName
                );
            } else {
                logger.debug(
                    error,
                    "An error occurred while running %s",
                    error.pluginExportName
                );
            }

            if (ctx.res.getBodyStage()?.getCompleteStage()) {
                // the request is already complete, writing more text would throw an error
                return;
            }

            const accept = accepts(ctx.req);

            if (process.env.NODE_ENV === "production") {
                if (accept.compare("application/json", "text/html")) {
                    await setError(ctx.res, message, status);
                } else {
                    const source = fillErrorPage({
                        num: status,
                        name: statusMessage,
                        description: prodErrorPageDesc,
                        versions: Array.from(packages.entries()).map(
                            ([name, version]) => ({name, version})
                        )
                    });

                    const body = await ctx.res.flushHeaders(status);
                    body.body.write(source);

                    await body.flushBody();
                }
            } else {
                if (accept.compare("application/json", "text/html")) {
                    await setError(ctx.res, message, status);
                } else {
                    const {default: descriptionSource} = await import(
                        "./error-description-dev.hbs"
                    );

                    const fillDescription =
                        Handlebars.compile(descriptionSource);

                    const allOtherMethods = Array.from(
                        new Set(
                            Array.from(middlewarePlugins!)
                                .map(plugin => {
                                    const method = getRouteMethod(plugin);
                                    const tester = getRouteTest(plugin);

                                    assert(
                                        method,
                                        "Missing pre-checked method on middleware plugin"
                                    );

                                    assert(
                                        tester,
                                        "Missing route tester on middleware plugin"
                                    );

                                    if (!tester(ctx.req.url.pathname)) return;

                                    return method;
                                })
                                .filter(Boolean)
                        )
                    );

                    const otherMethods =
                        allOtherMethods && allOtherMethods.length > 1
                            ? allOtherMethods?.slice(
                                  0,
                                  allOtherMethods.length - 1
                              )
                            : undefined;

                    const lastOtherMethod = allOtherMethods?.at(-1);

                    const description = fillDescription({
                        middlewareName: error.pluginName,
                        middlewarePluginName: error.pluginExportName,
                        stackTrace: stackWithLinks(error.stack),
                        otherMethods,
                        lastOtherMethod
                    });

                    const source = fillErrorPage({
                        num: status,
                        name: statusMessage,
                        description,
                        versions: Array.from(packages.entries()).map(
                            ([name, version]) => ({name, version})
                        )
                    });

                    const body = await ctx.res.flushHeaders(status);
                    body.body.write(source);

                    await body.flushBody();
                }
            }
        }
    }

    shouldHandle(): boolean {
        return true;
    }
}

class OpenEditorHandler extends RouteMiddlewarePlugin {
    constructor() {
        super(`GET /-/error-handler/open-in-editor`);
    }

    async run({req, res}: RoutedRequestContext): Promise<void> {
        const params = req.url.searchParams;

        const file = params.get("file");
        const lineStr = params.get("line");
        const columnStr = params.get("col");

        if (!file) {
            await setText(res, 400, "Error: Missing `file` query parameter");
            return;
        }

        if (!lineStr) {
            await setText(res, 400, "Error: Missing `line` query parameter");
            return;
        }

        const line = parseInt(lineStr);

        if (Number.isNaN(line)) {
            await setText(res, 400, "Error: `line` is not a number");
            return;
        }

        const column = columnStr ? parseInt(columnStr) : undefined;

        if (Number.isNaN(column)) {
            await setText(res, 400, "Error: `column` is not a number");
            return;
        }

        logger.debug("Opening file in the default editor");

        launchEditor(file, line, column ?? 0);

        await setText(res, 200, "Success");
    }
}

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,
    loadBefore: "*",
    init() {
        if (process.env.NODE_ENV === "production") {
            return new ErrorHandler();
        } else {
            return [new ErrorHandler(), new OpenEditorHandler()];
        }
    },
    onMetaLoaded(meta: EnvironmentMetadata) {
        packages.set(meta.pluginLoader.name, meta.pluginLoader.version);
        packages.set(meta.pluginSelector.name, meta.pluginSelector.version);
        packages.set(meta.backend.name, meta.backend.version);
        packages.set(name, version);

        if (process.env.NODE_ENV !== "production") {
            middlewarePlugins = new Set();

            for (const plugin of meta.plugins) {
                if (plugin.type !== "middleware") continue;

                const method = getRouteMethod(plugin);
                if (!method) continue;

                middlewarePlugins.add(plugin);
            }
        }
    }
};

export default pluginExport;
