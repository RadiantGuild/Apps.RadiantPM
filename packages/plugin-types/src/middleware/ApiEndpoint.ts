import {HttpMethod} from "./HttpMethod";

/**
 * Lets clients infer the param and body types for this endpoint
 */
export type ApiEndpoint<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Method extends HttpMethod,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    RequiredParams extends string | never,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    OptionalParams extends string | never,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Body,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Response
> = string & {
    readonly ["##marker##"]?: unique symbol;
};

export type MethodFromApiEndpoint<Endpoint> = Endpoint extends ApiEndpoint<
    infer Method,
    string | never,
    string | never,
    unknown,
    unknown
>
    ? Method
    : never;

export type RequiredParamsFromApiEndpoint<Endpoint> =
    Endpoint extends ApiEndpoint<
        HttpMethod,
        infer RequiredParams,
        string | never,
        unknown,
        unknown
    >
        ? RequiredParams
        : never;

export type OptionalParamsFromApiEndpoint<Endpoint> =
    Endpoint extends ApiEndpoint<
        HttpMethod,
        string | never,
        infer OptionalParams,
        unknown,
        unknown
    >
        ? OptionalParams
        : never;

export type BodyFromApiEndpoint<Endpoint> = Endpoint extends ApiEndpoint<
    HttpMethod,
    string | never,
    string | never,
    infer Body,
    unknown
>
    ? Body
    : never;

export type ResponseFromApiEndpoint<Endpoint> = Endpoint extends ApiEndpoint<
    HttpMethod,
    string | never,
    string | never,
    unknown,
    infer Response
>
    ? Response
    : never;
