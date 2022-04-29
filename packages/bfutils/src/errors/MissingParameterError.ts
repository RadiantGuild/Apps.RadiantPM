const symbol = Symbol("MissingParameterError");

type Writable<T> = {
    -readonly [Key in keyof T]: T[Key];
};

export interface MissingParameterError extends Error {
    readonly kind: typeof symbol;
    readonly paramName: string;
}

export function isMissingParameterError(err: Error): err is MissingParameterError {
    const asMpe = err as MissingParameterError;
    return asMpe.kind === symbol;
}

export function throwMissingParameterError(paramName: string): never {
    const error = new Error(`Missing parameter \`${paramName}\``) as Writable<MissingParameterError>;
    error.kind = symbol;
    error.paramName = paramName;
    throw error;
}
