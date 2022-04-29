import {PluginExport} from "@radiantpm/plugin-types";

type AnyPluginExport = PluginExport<unknown, boolean>;

export interface PluginInfo {
    name: string;
    export: AnyPluginExport;
}

export interface ExtendedPluginInfo extends PluginInfo {
    config: unknown;
}
