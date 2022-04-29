import {ok as assert} from "assert";
import {IncomingMessage, ServerResponse} from "http";
import {Writable} from "stream";
import {promisify} from "util";
import {createCompleteResponseContextBuilder} from "@radiantpm/backend-utilities";
import {
    BodyHttpResponse,
    CompleteHttpResponse,
    Headers,
    HeadersHttpResponse,
    HttpMethod,
    HttpRequest,
    MiddlewarePlugin,
    ReadonlyHeaders,
    RequestContext
} from "@radiantpm/plugin-types";
import {RpmLogger} from "@radiantpm/runtime-bootstrap";
import {Middleware} from "koa";
import c2k from "koa-connect";
import {name, version} from "../package.json";
import {
    enableRequestLoggingKey,
    middlewarePluginsKey,
    requestLoggerKey,
    runExpressMiddlewareSymbol,
    runMiddlewareKey
} from "./constants";

type ConnectMiddleware = (
    req: IncomingMessage,
    res: ServerResponse,
    callback: (...args: unknown[]) => void
) => void;

class WritableWrapper extends Writable {
    sendToFunction = false;

    constructor(
        private targetStream: Writable,
        private check: () => boolean,
        private targetFunction: (v: Buffer) => void
    ) {
        super();
    }

    _write(chunk: Buffer, encoding: BufferEncoding, next: () => void) {
        if (!this.check()) return next();

        if (this.sendToFunction) this.targetFunction(chunk);
        this.targetStream.write(chunk, encoding, next);
    }
}

function capitaliseHeaderName(name: string): string {
    return name
        .toLowerCase()
        .replace(/(^|-)([a-z])/g, (_, start, val) => start + val.toUpperCase());
}

const handleRequest: Middleware = async ctx => {
    const requestStart = process.hrtime.bigint();

    const logger: RpmLogger = ctx.app.context[requestLoggerKey];

    const resWrite = promisify<unknown, void>(ctx.res.write.bind(ctx.res));
    const resEnd = promisify(ctx.res.end.bind(ctx.res));

    const hostname = (
        ctx.headers["x-forwarded-host"]?.toString() ??
        ctx.headers.host?.toString()
    )?.split(",", 1)[0];

    if (!hostname) {
        ctx.status = 400;
        ctx.flushHeaders();
        await resWrite("Host header is required");
        await resEnd();
        return;
    }

    const protocol =
        ctx.headers["x-forwarded-proto"]?.toString().replace(/[^a-z]/g, "") ??
        "http";

    const baseUrl = `${protocol}://${hostname}`;

    const reqHeaders = ReadonlyHeaders.from(Object.entries(ctx.req.headers));

    const abortController = new AbortController();

    ctx.res.once("close", () => {
        abortController.abort();
    });

    const req: HttpRequest = {
        method: ctx.method as HttpMethod,
        url: new URL(ctx.url, baseUrl),
        headers: reqHeaders,
        body: ctx.req,
        signal: abortController.signal
    };

    let headersFlushed = false;
    let completeRes: CompleteHttpResponse | undefined;

    function checkBodyWritable() {
        if (completeRes) {
            if (process.env.NODE_ENV !== "production") {
                logger.warn(
                    "Attempted to write to the response after it has been completed. This warning won't show in production."
                );
            }

            return false;
        }

        if (abortController.signal.aborted) {
            if (process.env.NODE_ENV !== "production") {
                logger.warn(
                    "Attempted to write to the response after it has been aborted. This warning won't show in production."
                );
            }

            return false;
        }

        return true;
    }

    const completeResBuilder = createCompleteResponseContextBuilder(ctx.res);
    const responseWrapper = new WritableWrapper(
        ctx.res,
        checkBodyWritable,
        completeResBuilder.write
    );

    const res: HeadersHttpResponse = {
        stage: "headers",
        headers: new Headers(),
        flushHeaders(status: number): Promise<BodyHttpResponse> {
            if (headersFlushed) return Promise.resolve(bodyRes);

            ctx.status = status;

            for (const [name, value] of this.headers.entries()) {
                ctx.res.setHeader(capitaliseHeaderName(name), value);
            }

            ctx.flushHeaders();
            headersFlushed = true;

            return Promise.resolve(bodyRes);
        },
        enableBodySave() {
            responseWrapper.sendToFunction = true;
        },
        getBodyStage(): BodyHttpResponse | undefined {
            if (headersFlushed) return bodyRes;
            return;
        }
    };

    res.headers.set("server", `${name}/${version}`);

    const bodyRes: BodyHttpResponse = {
        stage: "body",
        body: responseWrapper,
        enableBodySave() {
            responseWrapper.sendToFunction = true;
        },
        async flushBody(): Promise<CompleteHttpResponse> {
            if (completeRes) return completeRes;

            completeRes = completeResBuilder.build();
            if (!ctx.res.writableEnded) await resEnd();
            return completeRes;
        },
        getCompleteStage(): CompleteHttpResponse | undefined {
            return completeRes;
        }
    };

    const pluginCtx = {
        async [runExpressMiddlewareSymbol](
            middleware: ConnectMiddleware,
            next?: () => Promise<void>
        ) {
            const koaMiddleware = c2k(middleware);
            await new Promise<void>((yay, nay) => {
                koaMiddleware(ctx, () =>
                    next ? next().then(yay).catch(nay) : Promise.resolve(yay())
                );
            });
        }
    };

    const requestCtx: RequestContext = {
        req,
        res,
        ctx: pluginCtx
    };

    const plugins = ctx.app.context[middlewarePluginsKey] as MiddlewarePlugin[];

    const runMiddleware = ctx.app.context[runMiddlewareKey] as (
        requestContext: RequestContext,
        plugins: MiddlewarePlugin[]
    ) => Promise<void>;

    const matchingPlugins = plugins.filter(pl =>
        pl.shouldHandle(req, pluginCtx)
    );

    if (matchingPlugins.length === 0) {
        ctx.status = 404;
        ctx.flushHeaders();
        await resWrite("No middleware to handle this request");
        await resEnd();
        return;
    }

    try {
        await runMiddleware(requestCtx, matchingPlugins);

        const bodyStage = res.getBodyStage();

        assert(bodyStage, `No middleware sent headers`);

        const completeStage = await bodyStage.flushBody();

        const requestEnd = process.hrtime.bigint();
        const requestDuration = requestEnd - requestStart;

        if (ctx.app.context[enableRequestLoggingKey]) {
            logger.info(
                {
                    req: {
                        method: req.method,
                        url: req.url,
                        headers: Object.fromEntries(
                            Array.from(req.headers.entries())
                        ),
                        remoteAddress: ctx.req.socket.remoteAddress,
                        remotePort: ctx.req.socket.remotePort
                    },
                    res: {
                        statusCode: completeStage.status,
                        headers: Object.fromEntries(
                            Array.from(completeStage.headers.entries())
                        ),
                        responseLength: responseWrapper.sendToFunction
                            ? completeStage.writtenBody.byteLength
                            : undefined
                    },
                    responseTimeNs: requestDuration.toString()
                },
                "Successfully completed request with %s middleware in %s milliseconds",
                matchingPlugins.length,
                requestDuration / 1000000n
            );
        }
    } catch (err) {
        ctx.status = 500;
        ctx.flushHeaders();

        logger.error(err, "An error occurred while handling a request");

        if (ctx.res.writableEnded) return;

        if (process.env.NODE_ENV === "production") {
            await resWrite("Internal server error");
        } else {
            const stack = err instanceof Error ? err.stack : `${err}`;
            await resWrite(stack);
        }

        await resEnd();
    }
};

export default handleRequest;
