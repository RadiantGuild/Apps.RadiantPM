/*! based on https://github.com/adriengibrat/ts-custom-error/ */
export default class CustomError extends Error {
    name: string;

    constructor(message: string, opts?: {cause?: Error}) {
        super(message, opts);

        Object.defineProperty(this, "name", {
            value: new.target.name,
            enumerable: false,
            configurable: true
        });

        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}
