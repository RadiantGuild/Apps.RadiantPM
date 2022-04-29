import SerialisablePluginBase from "../SerialisablePluginBase";

/**
 * @see StoragePlugin
 */
export default interface SerialisableStoragePlugin
    extends SerialisablePluginBase<"storage"> {
    id: string;
    assetUrl: string;
}
