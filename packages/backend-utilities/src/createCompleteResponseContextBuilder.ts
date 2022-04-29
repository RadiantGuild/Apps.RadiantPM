import {ServerResponse} from "http";
import {CompleteHttpResponse} from "@radiantpm/plugin-types";

export interface CreateCompleteResponseContextBuilderResult {
    /**
     * Should be called when new data is written to the HTTP response, with that data.
     * Appends the data to the internal buffer storing the response data
     */
    write(buff: Buffer): void;
    build(): CompleteHttpResponse;
}

/**
 * Returns a function that, when called, will build a CompleteHttpResponse based on the supplied `res`.
 * This method should be called before any data is written to the response body.
 */
export default function createCompleteResponseContextBuilder(res: ServerResponse): CreateCompleteResponseContextBuilderResult {
    const buffers: Buffer[] = [];

    return {
        write(buff: Buffer) {
            buffers.push(buff);
        },
        build(): CompleteHttpResponse {
            const headers = Object.entries(res.getHeaders())
                .filter(([, value]) => !!value)
                .map(([name, value]) => [name, value!.toString()] as [string, string]);

            return {
                stage: "complete",
                status: res.statusCode,
                headers: new Map(headers),
                writtenBody: Buffer.concat(buffers)
            };
        }
    };
}
