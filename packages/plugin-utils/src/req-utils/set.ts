import {
    BodyHttpResponse,
    CompleteHttpResponse,
    HeadersHttpResponse
} from "@radiantpm/plugin-types";

/**
 * Writes some data to the body
 */
interface SetFunction<T> {
    /**
     * Writes the response, automatically setting the content type and the status code
     * @param res The response at the headers stage
     * @param status The HTTP status code to write
     * @param data The JSON content to write
     * @param contentType The content-type header to set
     */
    (
        res: HeadersHttpResponse,
        status: number,
        data: T,
        contentType?: string
    ): Promise<CompleteHttpResponse>;

    /**
     * Writes the response to the body
     * @param res The response at the body stage
     * @param data The JSON content to write
     * @param contentType The content-type header to set
     */
    (
        res: BodyHttpResponse,
        data: T,
        contentType?: string
    ): Promise<CompleteHttpResponse>;
}

export const setText: SetFunction<string> = async (
    res: HeadersHttpResponse | BodyHttpResponse,
    status_data: number | string,
    data_contentType?: string,
    contentType?: string
) => {
    const actualContentType = (
        res.stage === "headers" ? contentType : data_contentType
    ) as string;
    if (res.stage === "headers")
        res.headers.set("Content-Type", actualContentType ?? "text/plain");
    const actualData = (
        res.stage === "headers" ? data_contentType : status_data
    ) as string;
    const bodyRes =
        res.stage === "headers"
            ? await res.flushHeaders(status_data as number)
            : res;

    await new Promise<void>((yay, nay) => {
        bodyRes.body.write(actualData, err => {
            if (err) nay(err);
            else yay();
        });
    });

    return await bodyRes.flushBody();
};

export const setJson: SetFunction<unknown> = (
    res: HeadersHttpResponse | BodyHttpResponse,
    status_json: number | unknown,
    json_contentType?: unknown | string,
    contentType?: string
) => {
    if (res.stage === "headers") {
        return setText(
            res,
            status_json as number,
            JSON.stringify(json_contentType),
            contentType ?? "application/json"
        );
    } else {
        return setText(
            res,
            JSON.stringify(status_json),
            json_contentType as string
        );
    }
};

export function setError(
    res: HeadersHttpResponse,
    error: string,
    status = 400
): Promise<CompleteHttpResponse> {
    res.headers.set("X-Error", "1");
    return setJson(res, status, {error, status});
}
