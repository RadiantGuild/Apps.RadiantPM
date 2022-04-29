/**
 * Fills out the variables in a URL whose path is in the form `[param]/[anotherParam]`. Will add query parameters if
 * there is no matching path parameter.
 * @param urlOrPath The URL. Can be absolute (must have a protocol) or just a path, and can include query parameters (which will be added to or overridden)
 * @param params The values of the parameters to fill. Keys map to the names in the path or the query parameter names.
 * @remarks Missing URL parameters will throw an error
 *
 * @example ```js
 * fillUrl("/repositories/[id]/search?sort=date", {
 *     id: "radiantpm",
 *     filter: "author:alduino"
 * }); // -> /repositories/radiantpm/search?sort=date&filter=author:alduino
 * ```
 */
import fillTemplate from "./fillTemplate";

function checkIfPath(url: string) {
    return url.startsWith("/");
}

type OnlyStringKV<T> = {
    [Key in keyof T]: Key extends string ? string : never;
};

interface FillUrl {
    <K extends string>(urlOrPath: string, params: ReadonlyMap<K, string>): string;
    <T extends OnlyStringKV<T>>(urlOrPath: string, params: T): string;
}

function fillUrlFn(urlOrPath: string, params: ReadonlyMap<string, string> | Record<string, string>): string {
    const isPath = checkIfPath(urlOrPath);

    const url = new URL(isPath ? `fake:${urlOrPath}` : urlOrPath);

    const filledPath = fillTemplate(url.pathname, params);
    url.pathname = filledPath.result;

    const paramEntries = params instanceof Map ? params.entries() : Object.entries(params);

    for (const [name, value] of paramEntries) {
        if (filledPath.usedValues.has(name)) continue;
        url.searchParams.set(name, value);
    }

    if (isPath) {
        if (url.search) return url.pathname + url.search;
        return url.pathname;
    } else {
        return url.toString();
    }
}

const fillUrl: FillUrl = fillUrlFn as FillUrl;
export default fillUrl;
