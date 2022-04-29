import {fillUrl} from "@radiantpm/bfutils";
import {
    ApiEndpoint,
    BodyFromApiEndpoint,
    HttpMethod,
    MethodFromApiEndpoint,
    OptionalParamsFromApiEndpoint,
    RequiredParamsFromApiEndpoint,
    ResponseFromApiEndpoint
} from "@radiantpm/plugin-types";

type BaseEndpoint = ApiEndpoint<
    HttpMethod,
    string | never,
    string | never,
    unknown,
    unknown
>;

type HasParams<Endpoint extends BaseEndpoint> =
    RequiredParamsFromApiEndpoint<Endpoint> extends never
        ? false
        : OptionalParamsFromApiEndpoint<Endpoint> extends never
        ? false
        : true;

type ParamsObjectFromEndpoint<Endpoint extends BaseEndpoint> = {
    [Param in RequiredParamsFromApiEndpoint<Endpoint>]: string;
} &
    {
        [Param in OptionalParamsFromApiEndpoint<Endpoint>]?: string;
    };

export type FetchFromApiOptions<Endpoint extends BaseEndpoint> = Omit<
    {
        body: BodyFromApiEndpoint<Endpoint>;
        params: HasParams<Endpoint> extends false
            ? never
            : ParamsObjectFromEndpoint<Endpoint>;
    },
    | (BodyFromApiEndpoint<Endpoint> extends never ? "body" : never)
    | (HasParams<Endpoint> extends false ? "params" : never)
>;

export default async function fetchFromApi<Endpoint extends BaseEndpoint>(
    url: Endpoint,
    method: MethodFromApiEndpoint<Endpoint>,
    opts: FetchFromApiOptions<Endpoint>
): Promise<ResponseFromApiEndpoint<Endpoint>> {
    const optsAsAll = opts as unknown as {
        body: unknown | undefined;
        params: Record<string, string> | undefined;
    };

    const body = optsAsAll.body ? JSON.stringify(optsAsAll.body) : null;

    const filledUrl = fillUrl<Record<string, string>>(
        url as unknown as string,
        optsAsAll.params ?? {}
    );

    const response = await fetch(filledUrl, {
        method,
        body
    });

    try {
        return await response.json();
    } catch (cause) {
        throw new Error("Failed to read well-known response data", {cause});
    }
}
