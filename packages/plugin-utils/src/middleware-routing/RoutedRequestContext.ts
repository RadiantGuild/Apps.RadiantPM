import {RequestContext} from "@radiantpm/plugin-types";

export default interface RoutedRequestContext extends RequestContext {
    params: ReadonlyMap<string, string>;
}
