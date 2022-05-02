import {EnvironmentMetadata, PluginExport} from "@radiantpm/plugin-types";
import CreateFeedMiddlewarePlugin from "./CreateFeedMiddlewarePlugin";
import CreatePackageMiddlewarePlugin from "./CreatePackageMiddlewarePlugin";
import WellKnownMiddlewarePlugin from "./WellKnownMiddlewarePlugin";
import {setAuthenticationPlugin, setDatabasePlugin} from "./state";

const wellKnownPlugin = new WellKnownMiddlewarePlugin();

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    init() {
        return [
            wellKnownPlugin,
            new CreateFeedMiddlewarePlugin(),
            new CreatePackageMiddlewarePlugin()
        ];
    },

    onMetaLoaded(meta: EnvironmentMetadata) {
        wellKnownPlugin.onMetaLoaded(meta);

        setAuthenticationPlugin(meta.selectedPlugins.authentication);
        setDatabasePlugin(meta.selectedPlugins.database);
    }
};

export default pluginExport;
