import {PluginExport} from "@radiantpm/plugin-types";

interface Configuration {
    /* SET SOME OPTIONS HERE */
}

const pluginExport: PluginExport<Configuration, false> = {
    init() {
        return /* CREATE THE PLUGIN HERE */;
    }
};

export default pluginExport;
