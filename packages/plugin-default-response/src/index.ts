import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {
    MiddlewarePlugin,
    PluginExport
} from "@radiantpm/plugin-types";

class DefaultResponseMiddlewarePlugin implements MiddlewarePlugin {
    type: "middleware" = "middleware";

    [context: symbol]: unknown;

    handle(): void {
        throw new HttpError(404);
    }

    shouldHandle(): boolean {
        return true;
    }
}

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,
    loadAfter: "*",
    init() {
        return new DefaultResponseMiddlewarePlugin();
    }
};

export default pluginExport;
