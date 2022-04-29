import {Readable} from "stream";
import {ReadonlyHeaders} from "./Headers";
import {HttpMethod} from "./HttpMethod";

export default interface HttpRequest {
    method: HttpMethod;
    url: URL;
    headers: ReadonlyHeaders;
    body: Readable;
    signal: AbortSignal;
}
