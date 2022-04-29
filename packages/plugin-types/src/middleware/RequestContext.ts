import HttpRequest from "./HttpRequest";
import {HeadersHttpResponse} from "./http-response";

export default interface RequestContext {
    req: HttpRequest;
    res: HeadersHttpResponse;
    ctx: Record<string | symbol, unknown>;
}
