import {Scope} from "@radiantpm/plugin-types";
import {deflate, inflate} from "pako";

/**
 * Parses the b64url.gz scope string into a JS object
 * @param scopeStr Scope string
 */
export function parseScopeString(scopeStr: string): Scope {
    const buff = new Buffer(scopeStr, "base64url");
    const inflated = inflate(buff, {to: "string"});
    return JSON.parse(inflated);
}

type ErrorCheckedResult<T> =
    | {kind: "error"; thrown: Error; message: string}
    | {kind: "result"; result: T};

export function parseScopeStringWithErrorChecking(
    scopeStr: string
): ErrorCheckedResult<Scope> {
    let buff: Buffer;
    try {
        buff = new Buffer(scopeStr, "base64url");
    } catch (thrown) {
        return {
            kind: "error",
            message: "Scope is not in base64url format",
            thrown
        };
    }

    let inflated: string;
    try {
        inflated = inflate(buff, {to: "string"});
    } catch (thrown) {
        return {
            kind: "error",
            message: "Encoded data is not deflated",
            thrown
        };
    }

    try {
        return {
            kind: "result",
            result: JSON.parse(inflated)
        };
    } catch (thrown) {
        return {
            kind: "error",
            message: "Inflated data is not JSON",
            thrown
        };
    }
}

/**
 * Creates a b64url.gz scope string from its JS object
 * @param scope Scope obj
 */
export function createScopeString(scope: Scope): string {
    const str = JSON.stringify(scope);
    const deflated = deflate(str);
    const buffer = Buffer.from(deflated);
    return buffer.toString("base64url");
}
