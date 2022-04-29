import MiddlewareError from "./MiddlewareError";

interface Options<ReturnError extends boolean> {
    /**
     * When this value is true, an error that is thrown in the next middleware
     * will be the return value, instead of letting it propagate.
     *
     * This exists for plugins that want to handle errors to prevent having lots
     * of try/catches (and to provide more specific typings).
     */
    returnError: ReturnError;
}

export default interface MiddlewareNextFunction {
    (opts?: Options<false>): Promise<void>;

    (opts: Options<true>): Promise<MiddlewareError | undefined>;
}
