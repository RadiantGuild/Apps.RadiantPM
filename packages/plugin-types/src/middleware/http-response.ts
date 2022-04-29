import {Writable} from "stream";
import Headers from "./Headers";

/**
 * The first stage of a response, where the headers and status code are set
 */
export interface HeadersHttpResponse {
    readonly stage: "headers";

    /**
     * Allows methods to add some context that they want to save. These values
     * will not be copied into the BodyHttpResponse.
     */
    [ctx: symbol]: unknown;

    /**
     * HTTP headers to send in the response
     */
    readonly headers: Headers;

    /**
     * Flushes the headers and the specified status code, sending them to the client
     */
    flushHeaders(status: number): Promise<BodyHttpResponse>;

    /**
     * After this function is called, any data written to the body will be included in the `CompleteHttpResponse`'s
     * `writtenBody` field. Otherwise, that field will be an empty buffer.
     */
    enableBodySave(): void;

    /**
     * If `flushHeaders` has already been called, this should return that `BodyHttpResponse`, otherwise return undefined
     */
    getBodyStage(): BodyHttpResponse | undefined;
}

/**
 * This stage is where you can send information inside the response body
 */
export interface BodyHttpResponse {
    readonly stage: "body";

    /**
     * Allows methods to add some context that they want to save. These values
     * will not be copied into the CompleteHttpResponse.
     */
    [ctx: symbol]: unknown;

    /**
     * Stream that sends body data to the client
     */
    readonly body: Writable;

    /**
     * After this function is called, any data written to `body` will be included in the `CompleteHttpResponse`'s
     * `writtenBody` field. Otherwise, that field will be an empty buffer.
     */
    enableBodySave(): void;

    /**
     * Closes the stream
     */
    flushBody(): Promise<CompleteHttpResponse>;

    /**
     * If `flushBody` has already been called, this should return that `CompleteHttpResponse`, otherwise return
     * undefined
     */
    getCompleteStage(): CompleteHttpResponse | undefined;
}

/**
 * A roundup of all the information sent in the other states. To create this object, you can use
 * `createCompleteResponseContextBuilder` from `@radiantpm/backend-utilities`, which compiles all the information for
 * you.
 */
export interface CompleteHttpResponse {
    readonly stage: "complete";

    /**
     * The status code that was sent in `flushHeaders`
     */
    readonly status: number;

    /**
     * All headers that were sent to the client
     */
    readonly headers: ReadonlyMap<string, string>;

    /**
     * The body that was sent, converted to a buffer
     */
    readonly writtenBody: Buffer;
}
