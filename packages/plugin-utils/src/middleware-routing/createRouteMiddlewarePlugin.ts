import {
    HttpRequest,
    MiddlewarePlugin,
    RequestContext
} from "@radiantpm/plugin-types";
import RoutedRequestContext from "./RoutedRequestContext";
import {matchPath, matchRequest, parseRoute, Route} from "./path-matching";
import {setRouteMethod, setRouteTest} from "./symbols";

export type HandleFunction = (
    ctx: RoutedRequestContext,
    next: () => Promise<void>
) => void | Promise<void>;

/**
 * Creates a middleware plugin for a single route
 *
 * @param route A route in the format `[http method] [path]`.
 * Path must start with `/`.
 * The path can include parameters in it, in the same format as NextJS.
 * Parameters that include slashes are allowed anywhere, so long as there is a literal segment between them.
 *
 * @param handle Request handler, directly placed in plugin as `handle` function.
 * Route parameters are included under `ctx.params`.
 *
 * @param name A name to display in some logs associated with this middleware to help with debugging.
 * Defaults to the route.
 */
export default function createRouteMiddlewarePlugin(
    route: Route,
    handle: HandleFunction,
    name: string = route
): MiddlewarePlugin {
    const parsedRoute = parseRoute(route);
    const symbol = Symbol(`middleware:${route}`);

    const plugin: MiddlewarePlugin = {
        type: "middleware",
        name,
        shouldHandle(req: HttpRequest, ctx: Record<symbol, unknown>): boolean {
            const params = matchRequest(req, parsedRoute);
            if (params === false) return false;
            ctx[symbol] = params;
            return true;
        },
        handle(
            ctx: RequestContext,
            next: () => Promise<void>
        ): void | Promise<void> {
            const params = ctx.ctx[symbol] as ReadonlyMap<string, string>;
            const routedReqCtx: RoutedRequestContext = {...ctx, params};
            return handle(routedReqCtx, next);
        }
    };

    setRouteTest(plugin, path => {
        return !!matchPath(path, parsedRoute.pathParts);
    });

    setRouteMethod(plugin, parsedRoute.method);

    return plugin;
}
