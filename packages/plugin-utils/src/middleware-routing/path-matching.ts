import {ok as assert} from "assert";
import {HttpMethod, HttpRequest} from "@radiantpm/plugin-types";

export type Route = `${HttpMethod} /${string}`;

export interface LiteralPathPart {
    kind: "literal";
    path: string;
}

export interface MatchPathPart {
    kind: "match";
    name: string;
    matchesSlashes: boolean;
}

export type PathPart = LiteralPathPart | MatchPathPart;

export interface ParsedRoute {
    method: HttpMethod;
    pathSource: string;
    pathParts: PathPart[];
}

const MATCH_PATH_REGEX = /^\[[^\]]+]$/;
const SLASH_MATCH_PATH_REGEX = /^\[\.\.\.[^\]]+]$/;

/**
 * Parses a route in the format `[http method] /[path]` to get the method and each route part
 * @param route The route string
 */
export function parseRoute(route: Route): ParsedRoute {
    const spaceIndex = route.indexOf(" ");
    const method = route.substring(0, spaceIndex) as HttpMethod;
    const path = route.substring(spaceIndex + 1);

    const pathParts = new Array<PathPart & {toString(): string}>();
    const pathSplit = path.split("/");

    let hasLiteralBetween = true;
    for (const pathPart of pathSplit) {
        if (SLASH_MATCH_PATH_REGEX.test(pathPart)) {
            assert(
                hasLiteralBetween,
                "Slash matches must have at least one literal path segment between them"
            );

            const name = pathPart.substring(4, pathPart.length - 1);

            hasLiteralBetween = false;
            pathParts.push({
                kind: "match",
                name,
                matchesSlashes: true,
                toString() {
                    return `[...${name}]`;
                }
            });
        } else if (MATCH_PATH_REGEX.test(pathPart)) {
            const name = pathPart.substring(1, pathPart.length - 1);

            pathParts.push({
                kind: "match",
                name,
                matchesSlashes: false,
                toString() {
                    return `[${name}]`;
                }
            });
        } else {
            hasLiteralBetween = true;
            pathParts.push({
                kind: "literal",
                path: pathPart,
                toString() {
                    return pathPart;
                }
            });
        }
    }

    return {
        method,
        pathSource: path,
        pathParts
    };
}

function countWhile<T>(arr: T[], check: (part: T) => boolean) {
    let i = 0;
    while (i < arr.length && check(arr[i])) i++;
    return i;
}

/**
 * Checks to see if a path matches the parsed route parts. If they don't match, `false` is returned, otherwise the parameters that were matched are returned.
 * @param url The path to check. Query parameters are ignored.
 * @param pathParts The path parts, from `parseRoute().pathParts`
 */
export function matchPath(url: string, pathParts: ParsedRoute["pathParts"]): ReadonlyMap<string, string> | false {
    const queryParameters = new Map<string, string>();

    // remove query from url
    const urlPathParts = url.split("/");
    const routePathParts = pathParts.slice();

    while (urlPathParts.length > 0 && routePathParts.length > 0) {
        const routePathPart = routePathParts.shift();
        if (!routePathPart || urlPathParts.length === 0) return false;

        if (routePathPart.kind === "literal") {
            const urlPathPart = urlPathParts.shift() as string;
            if (urlPathPart !== routePathPart.path) return false;
        } else {
            if (!urlPathParts[0]) {
                // ignore empty URL parts as they cause bugs
                return false;
            }

            if (routePathPart.matchesSlashes) {
                if (routePathParts.length === 0) {
                    // last path part, consume all the rest of the url path parts
                    const value = urlPathParts.join("/");
                    urlPathParts.length = 0;
                    queryParameters.set(routePathPart.name, value);
                } else {
                    const followingMatches = countWhile(
                        routePathParts,
                        part => part.kind === "match"
                    );

                    const firstLiteral = routePathParts[
                        followingMatches
                        ] as LiteralPathPart;

                    // search for the first literal, after at least `followingMatches` items
                    const firstLiteralIndex = firstLiteral
                        ? urlPathParts.findIndex(
                            (v, i) =>
                                i >= followingMatches &&
                                v === firstLiteral.path
                        )
                        : urlPathParts.length;

                    if (firstLiteralIndex === -1) return false;

                    // this part of the path goes for `firstLiteralIndex - followingMatches` items
                    const pathParts = urlPathParts.splice(
                        0,
                        firstLiteralIndex - followingMatches
                    );
                    const value = pathParts.join("/");
                    queryParameters.set(routePathPart.name, value);
                }
            } else {
                const value = urlPathParts.shift() as string;
                queryParameters.set(routePathPart.name, value);
            }
        }
    }

    if (routePathParts.length > 0 || urlPathParts.length > 0) return false;
    return queryParameters;
}

/**
 * Matches a path to a parsed Route. Returns `false` if it does not match, or the query parameters of the match if it did
 * @param req The request to match against. Only needs the method and url fields.
 * @param parsedRoute The parsed route, returned from `parseRoute()`
 */
export function matchRequest(
    req: Pick<HttpRequest, "method" | "url">,
    parsedRoute: ParsedRoute
): ReadonlyMap<string, string> | false {
    const {method, pathParts} = parsedRoute;

    if (req.method.toUpperCase() !== method.toUpperCase()) return false;

    return matchPath(req.url.pathname, pathParts);
}
