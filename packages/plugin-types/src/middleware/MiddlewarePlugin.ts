import PluginBase from "../PluginBase";
import HttpRequest from "./HttpRequest";
import MiddlewareNextFunction from "./MiddlewareNextFunction";
import RequestContext from "./RequestContext";

export default interface MiddlewarePlugin extends PluginBase<"middleware"> {
    /**
     * Allows special information to be added to the plugin to be used later
     */
    [context: symbol]: unknown;

    /**
     * A name for this plugin that is displayed in the logs. Useful for
     * debugging an issue caused by a plugin in an export, to figure out which
     * one.
     */
    name?: string;

    /**
     * Returns true if the handle function should be called
     * @param req - The request to check
     * @param ctx - Some context for this request
     */
    shouldHandle(req: HttpRequest, ctx: Record<symbol, unknown>): boolean;

    /**
     * Called on a request where shouldHandle returned true
     * @remarks `next` does not need to be called. In this case, this will be the last middleware to run.
     * @param ctx - Object with request, response, and an object for middleware use
     * @param next - Call to trigger the next middleware. Will return when that middleware completes.
     */
    handle(ctx: RequestContext, next: MiddlewareNextFunction): void | Promise<void>;
}
