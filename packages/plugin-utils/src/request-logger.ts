import {createLogger} from "@radiantpm/log";
import {
    HttpMethod,
    HttpRequest,
    MiddlewarePlugin
} from "@radiantpm/plugin-types";

const logger = createLogger("plugin-utils:request-logger");

const alreadyLoggedSymbol = Symbol.for("plugin-utils:request-logger:logged");

export interface RequestLoggerOptions {
    /**
     * Tests if any of the elements match.
     * A string filter checks if the request URL starts with that string.
     * A regex filter checks if the request URL matches the regex.
     */
    urlFilters?: (string | RegExp)[];
    methodFilters?: HttpMethod[];
}

/**
 * Logs every request sent that matches the filters.
 * Useful when reverse engineering API clients to see what requests they send.
 * No response is sent, so you can safely include this plugin at any point.
 * @param options Options including filtering.
 */
export default function createRequestLogger(
    options: RequestLoggerOptions = {}
): MiddlewarePlugin {
    return {
        type: "middleware",
        name: "request-logger",
        shouldHandle(req: HttpRequest): boolean {
            if (req[alreadyLoggedSymbol]) {
                return false;
            }

            const urlFilterMatches =
                !options.urlFilters ||
                options.urlFilters.some(filter => {
                    if (typeof filter === "string") {
                        return req.url.pathname.startsWith(filter);
                    } else {
                        return filter.test(req.url.pathname);
                    }
                });

            const methodFilterMatches =
                !options.methodFilters ||
                options.methodFilters.some(filter => req.method === filter);

            if (urlFilterMatches && methodFilterMatches) {
                req[alreadyLoggedSymbol] = true;
                logger.info("%s %s", req.method, req.url);
            }

            return true;
        },
        handle(_, next): Promise<void> {
            return next();
        }
    };
}
