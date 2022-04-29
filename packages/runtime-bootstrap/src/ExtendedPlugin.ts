import {Plugin} from "@radiantpm/plugin-types";

export default interface ExtendedPlugin<PluginType extends Plugin = Plugin> {
    plugin: PluginType;
    ownerName: string;
}
