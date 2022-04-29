import assert from "assert";
import {
    HeadersHttpResponse,
    HttpRequest,
    ReadonlyHeaders
} from "@radiantpm/plugin-types";

interface Item {
    type: string;
    q: number;
}

export class Accept {
    private readonly items: readonly Item[];

    constructor(value: string) {
        this.items = Accept.parse(value);
    }

    private static isTypeEqual(a: string, b: string) {
        // TODO: check if they are equivalent too

        if (a === "*/*" || b === "*/*") return true;
        return a.toLowerCase() === b.toLowerCase();
    }

    private static buildEqualityComparer(
        a: string
    ): (b: string | Item) => boolean {
        return b => {
            const bVal = typeof b === "string" ? b : b.type;
            return Accept.isTypeEqual(a, bVal);
        };
    }

    private static parse(value: string): Item[] {
        return value.split(",").map(v => Accept.parseItem(v));
    }

    private static parseItem(v: string): Item {
        const parts = v
            .split(";")
            .filter(Boolean)
            .map(el => Accept.parsePart(el));
        const object = Object.fromEntries(parts);

        assert(object.type, "Missing type in parsed item. This is a bug.");

        return {
            ...object,
            type: object.type,
            q: object.q == null ? 1 : parseFloat(object.q)
        };
    }

    private static parsePart(v: string) {
        // if there is no key, the value will be in A, and the key should be "type"
        // if there is a key, the key will be in A, and the value will be in B
        const [a, b] = v.split("=").map(el => el.trim());

        const key = b ? a : "type";
        const value = b ? b : a;

        return [key, value] as const;
    }

    /**
     * Returns true if the client accepts the mime type, and its `q` value is
     * greater than the threshold supplied
     */
    check(mimeType: string, threshold = 0): boolean {
        return this.items.some(
            ({type, q}) => q > threshold && Accept.isTypeEqual(mimeType, type)
        );
    }

    /**
     * Returns true if the client prefers `mimeTypeA`, and false if it prefers
     * `mimeTypeB`. If the client does not accept either, it will return true by
     * default. You can call `check()` to check if the client accepts a type.
     */
    compare(mimeTypeA: string, mimeTypeB: string): boolean {
        const aIndex = this.items.findIndex(
            Accept.buildEqualityComparer(mimeTypeA)
        );

        const bIndex = this.items.findIndex(
            Accept.buildEqualityComparer(mimeTypeB)
        );

        if (aIndex === -1) return false;
        if (bIndex === -1) return true;

        const a = this.items[aIndex];
        const b = this.items[bIndex];

        if (a.q === b.q) return aIndex < bIndex;
        return a.q >= b.q;
    }
}

function getAcceptHeader(
    src: ReadonlyHeaders | HttpRequest | HeadersHttpResponse | string
): string {
    if (typeof src === "string") return src;
    if (src instanceof ReadonlyHeaders) return src.getAll("accept").join(",");
    return getAcceptHeader(src.headers);
}

export interface AcceptFn {
    /**
     * Parses the `accept` header and returns some utility functions based on it
     * @param headers The headers object to read the `Accept` header from
     */
    (headers: ReadonlyHeaders): Accept;

    /**
     * Parses the `accept` header and returns some utility functions based on it
     * @param req The HTTP request to read the `Accept` header from
     */
    (req: HttpRequest): Accept;

    /**
     * Parses the `accept` header and returns some utility functions based on it
     *
     * @param res The HTTP response to read the `Accept` header from.
     * Must be at the headers stage.
     */
    (res: HeadersHttpResponse): Accept;

    /**
     * Parses the `accept` header and returns some utility functions based on it
     * @param acceptHeader The value of the `Accept` header
     */
    (acceptHeader: string): Accept;
}

export const accepts: AcceptFn = (
    src: ReadonlyHeaders | HttpRequest | HeadersHttpResponse | string
): Accept => {
    const srcStr = getAcceptHeader(src);
    return new Accept(srcStr);
};
