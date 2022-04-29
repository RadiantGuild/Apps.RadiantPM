import {RuntimeMetadata} from "@radiantpm/plugin-types";
import Context from "../Context";
import {RuntimeLibrary} from "../runtime-libraries";

export default async function getMeta(lib: RuntimeLibrary, context: Context): Promise<RuntimeMetadata> {
    return {
        name: lib.name,
        version: lib.version,
        data: await lib.getMetaData(context)
    };
}
