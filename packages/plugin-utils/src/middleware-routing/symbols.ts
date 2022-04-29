import {HttpMethod, MiddlewarePlugin} from "@radiantpm/plugin-types";

const routeTestSymbol = Symbol.for("@radiantpm/utils:middleware-route-test");
const routeMethodSymbol = Symbol.for(
    "@radiantpm/utils:middleware-route-method"
);

/**
 * If the middleware plugin was created by `createRouteMiddlewarePlugin` or `RouteMiddlewarePlugin`,
 * this method returns a function that checks if this route would match the specified path,
 * ignoring the method.
 */
export function getRouteTest(
    plugin: MiddlewarePlugin
): (path: string) => boolean | undefined {
    return plugin[routeTestSymbol] as (path: string) => boolean | undefined;
}

/**
 * If the middleware plugin was created by `createRouteMiddlewarePlugin`
 * or `RouteMiddlewarePlugin`, this method returns the method it matches with.
 */
export function getRouteMethod(
    plugin: MiddlewarePlugin
): HttpMethod | undefined {
    return plugin[routeMethodSymbol] as HttpMethod | undefined;
}

/**
 * Sets the value that `getRoutePath` returns
 * @internal
 */
export function setRouteTest(
    plugin: MiddlewarePlugin,
    tester: (path: string) => boolean
): void {
    plugin[routeTestSymbol] = tester;
}

/**
 * Sets the value that `getRouteMethod` returns
 * @internal
 */
export function setRouteMethod(
    plugin: MiddlewarePlugin,
    method: HttpMethod
): void {
    plugin[routeMethodSymbol] = method;
}
