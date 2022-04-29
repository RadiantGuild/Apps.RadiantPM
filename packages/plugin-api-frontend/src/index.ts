import {EnvironmentMetadata, PluginExport} from "@radiantpm/plugin-types";
import CreateFeedMiddlewarePlugin from "./CreateFeedMiddlewarePlugin";
import WellKnownMiddlewarePlugin from "./WellKnownMiddlewarePlugin";
import {setAuthenticationPlugin, setDatabasePlugin} from "./state";

const wellKnownPlugin = new WellKnownMiddlewarePlugin();

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    init() {
        return [wellKnownPlugin, new CreateFeedMiddlewarePlugin()];
    },

    onMetaLoaded(meta: EnvironmentMetadata) {
        wellKnownPlugin.onMetaLoaded(meta);

        setAuthenticationPlugin(meta.selectedPlugins.authentication);
        setDatabasePlugin(meta.selectedPlugins.database);
    }
};

export default pluginExport;
