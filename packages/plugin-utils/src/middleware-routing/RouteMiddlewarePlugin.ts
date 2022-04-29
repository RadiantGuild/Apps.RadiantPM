import {
    HttpRequest,
    MiddlewarePlugin,
    RequestContext
} from "@radiantpm/plugin-types";
import RoutedRequestContext from "./RoutedRequestContext";
import {
    matchPath,
    matchRequest,
    ParsedRoute,
    parseRoute,
    Route
} from "./path-matching";
import {setRouteMethod, setRouteTest} from "./symbols";

export default abstract class RouteMiddlewarePlugin
    implements MiddlewarePlugin
{
    type = "middleware" as const;

    [context: symbol]: unknown;

    private readonly parsedRoute: ParsedRoute;
    private readonly symbol: symbol;

    /**
     * Creates a middleware plugin for a single route
     *
     * @param route A route in the format `[http method] [path]`.
     * Path must start with `/`.
     * The path can include parameters in it, in the same format as NextJS.
     * Parameters that include slashes are allowed anywhere, so long as there is a literal segment between them.
     */
    protected constructor(route: Route) {
        this.parsedRoute = parseRoute(route);
        this.symbol = Symbol("route context");

        setRouteTest(this, path => {
            return !!matchPath(path, this.parsedRoute.pathParts);
        });

        setRouteMethod(this, this.parsedRoute.method);
    }

    shouldHandle(req: HttpRequest, ctx: Record<symbol, unknown>): boolean {
        const params = matchRequest(req, this.parsedRoute);
        if (params === false) return false;
        ctx[this.symbol] = params;
        return true;
    }

    handle(
        ctx: RequestContext,
        next: () => Promise<void>
    ): void | Promise<void> {
        const params: ReadonlyMap<string, string> = ctx.ctx[
            this.symbol
        ] as ReadonlyMap<string, string>;
        const routedReqCtx: RoutedRequestContext = {...ctx, params};
        return this.run(routedReqCtx, next);
    }

    abstract run(
        ctx: RoutedRequestContext,
        next: () => Promise<void>
    ): void | Promise<void>;
}
