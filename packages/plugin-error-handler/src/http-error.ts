import {STATUS_CODES} from "http";
import CustomError from "./CustomError";

/**
 * An error which sets the status code on the response
 */
export default class HttpError extends CustomError {
    readonly baseMessage: string;

    constructor(public readonly status: number, message?: string, opts?: {cause?: Error}) {
        const msg = message ?? `${status} ${STATUS_CODES[status]}`;

        super(`${msg}
Note: something is handling this error incorrectly. Here are some things that might have gone wrong:
- You are missing @radiantpm/plugin-error-handler. Please add it to the top of your plugins list.
- You are missing an \`await\` for a call to  \`next()\` in a middleware plugin
- This error is getting caught and logged somewhere other than @radiantpm/plugin-error-handler`, opts);

        Object.defineProperty(this, "baseMessage", {
            value: msg,
            enumerable: true,
            configurable: false
        });
    }
}
