import {BodyHttpResponse, HeadersHttpResponse, HttpRequest} from "@radiantpm/plugin-types";

const cookiesContext = Symbol("req-utils:header:cookiesContext");

interface CookiesContextItem {
    /**
     * URL-encoded name of the cookie
     */
    name: string;

    /**
     * URL-encoded value of the cookie
     */
    value: string;

    /**
     * Options that were used to create the cookie
     */
    options: SetCookieOptions;
}

export enum SameSite {
    /**
     * The browser will only send the cookie for requests coming from the same domain
     * (not including subdomains or different ports)
     */
    strict = "Strict",

    /**
     * The cookie is not sent for cross-site requests (e.g. loading images),
     * but it is sent when the user navigates to the site from an external site
     */
    lax = "Lax",

    /**
     * The browser will send the cookie with both cross-site and same-site requests. Requires `secure` to be enabled.
     */
    none = "None"
}

export interface SetCookieOptions {
    /**
     * Sets the date that the cookie will expire.
     * If this value is not set, the cookie will be deleted when the user's session ends.
     */
    expires?: Date;

    /**
     * The maximum age of the cookie, in seconds.
     * Setting to zero or a negative number will destroy the cookie.
     */
    maxAge?: number;

    /**
     * Specifies the domain that the cookie should be available on. It will also be available on that domain's subdomains.
     */
    domain?: string;

    /**
     * Specifies the base path that the URL must have for the browser to send the cookie. Subdirectories are included.
     */
    path?: string;

    /**
     * Requires the website to be accessed using HTTPS (or localhost in some browsers) for the cookie to be sent
     */
    secure?: boolean;

    /**
     * Stops client-side code from being allowed to access the cookie
     * (although, it will still be sent in requests from the client)
     */
    httpOnly?: boolean;

    /**
     * Controls if the cookie is sent with cross-site requests
     */
    sameSite?: SameSite;
}

/**
 * Adds a Set-Cookie header to the response
 * @param res The response to write the cookie on
 * @param name The name of the cookie. Value will be URL encoded
 * @param value The value of the cookie. Will be URL encoded
 * @param options Any options for the cookie setting. See [the MDN docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#attributes).
 */
export function addCookie(
    res: HeadersHttpResponse,
    name: string,
    value: string,
    options: SetCookieOptions = {}
): void {
    const outputValues = new Map<string, string | null>();

    const encodedName = encodeURIComponent(name);
    const encodedValue = encodeURIComponent(value);

    outputValues.set(encodedName, encodedValue);

    if (options.expires != null)
        outputValues.set("Expires", options.expires.toUTCString());
    if (options.maxAge != null)
        outputValues.set("Max-Age", options.maxAge.toFixed(0));
    if (options.domain != null) outputValues.set("Domain", options.domain);
    if (options.path != null) outputValues.set("Path", options.path);
    if (options.sameSite != null)
        outputValues.set("SameSite", options.sameSite);
    if (options.httpOnly) outputValues.set("HttpOnly", null);
    if (options.secure) outputValues.set("Secure", null);

    const outputEntries = Array.from(outputValues.entries()).map(([k, v]) =>
        v == null ? k : `${k}=${v}`
    );

    const header = outputEntries.join("; ");
    res.headers.add("Set-Cookie", header);

    const contextObj: CookiesContextItem = {
        name: encodedName,
        value: encodedValue,
        options
    };

    if (res[cookiesContext]) {
        (res[cookiesContext] as CookiesContextItem[]).push(contextObj);
    } else {
        res[cookiesContext] = [contextObj];
    }
}

function hasCookieExpired(options: SetCookieOptions) {
    if (
        options.expires != null &&
        options.expires.getTime() <= new Date().getTime()
    ) {
        return true;
    }

    return options.maxAge != null && options.maxAge <= 0;
}

export enum CookieRemovalMethod {
    alreadyRemoved,
    creationCancelled,
    expireInPast
}

function removeCookieFromContextsArr(
    arr: CookiesContextItem[] | null,
    name: string
) {
    if (arr == null) return false;

    const idx = arr.findIndex(it => it.name === name);
    if (idx === -1) return false;

    const obj = arr[idx];
    if (hasCookieExpired(obj.options))
        return CookieRemovalMethod.alreadyRemoved;

    arr.splice(idx, 1);
    return CookieRemovalMethod.creationCancelled;
}

/**
 * Instructs the client to delete the specified cookie immediately.
 * @param res The response to use to delete the cookie
 * @param name The name of the cookie to delete
 * @remarks Handles the cookie being created by this request too
 * @returns The method that was used to remove the cookie
 */
export function removeCookie(
    res: HeadersHttpResponse,
    name: string
): CookieRemovalMethod {
    const encodedName = encodeURIComponent(name);

    const contextsArr = res[cookiesContext] as CookiesContextItem[] | null;

    const removedFromContext = removeCookieFromContextsArr(
        contextsArr,
        encodedName
    );

    if (removedFromContext !== false) return removedFromContext;

    addCookie(res, name, "", {path: "/", expires: new Date(0)});

    return CookieRemovalMethod.expireInPast;
}

function isHttpResponse(
    src: HttpRequest | HeadersHttpResponse
): src is HeadersHttpResponse {
    const casted = src as HeadersHttpResponse;
    return casted.stage === "headers";
}

const parseCookieRegex = /(?<name>[^=]+)=(?<value>[^;]+)/;

function parseCookies(
    cookieHeaders: readonly string[]
): ReadonlyMap<string, string> {
    const cookieDeclarations = cookieHeaders.flatMap(header =>
        header.split(";")
    );

    const map = new Map<string, string>();

    for (const header of cookieDeclarations) {
        const result = header.match(parseCookieRegex);
        if (!result?.groups) continue;

        const {name, value} = result.groups;
        map.set(name, value);
    }

    return map;
}

/**
 * Reads a cookie from a request or response. Ignores any attributes.
 */
export function getCookie(
    src: HttpRequest | HeadersHttpResponse,
    name: string
): string | undefined {
    if (isHttpResponse(src)) {
        const contextsArr = src[cookiesContext] as CookiesContextItem[] | null;
        const cookieFromContext = contextsArr?.find(it => it.name === name);
        if (cookieFromContext) return cookieFromContext.value;
    }

    const parsedCookies = parseCookies(src.headers.getAll("cookie"));
    return parsedCookies.get(name);
}

/**
 * Redirects the user to the URL or path provided.
 * @param src HTTP response to set the redirection information on.
 * @param url The URL or path that the user should be redirected to.
 * @param permanent Whether or not to cache the redirection.
 */
export async function redirect(src: HeadersHttpResponse, url: string | URL, permanent = false): Promise<BodyHttpResponse> {
    src.headers.set("location", url.toString());
    return await src.flushHeaders(permanent ? 308 : 307);
}
