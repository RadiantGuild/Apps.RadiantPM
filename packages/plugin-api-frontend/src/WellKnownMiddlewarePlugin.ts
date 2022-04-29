import {getSerialisablePlugin} from "@radiantpm/frontend-utilities";
import {
    EnvironmentMetadata,
    fileCategories,
    WellKnownData
} from "@radiantpm/plugin-types";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "@radiantpm/plugin-utils";
import {setJson} from "@radiantpm/plugin-utils/req-utils";
import endpoints from "./constants/endpoints";

const wellKnownData: WellKnownData = {
    // filled out in `onMetaLoaded`
    plugins: {
        storage: {}
    } as WellKnownData["plugins"],
    endpoints
};

export default class WellKnownMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor() {
        super("GET /.well-known/radiantpm.json");
    }

    onMetaLoaded(metadata: EnvironmentMetadata): void {
        wellKnownData.plugins.authentication = getSerialisablePlugin(
            metadata.selectedPlugins.authentication
        );

        wellKnownData.plugins.database = getSerialisablePlugin(
            metadata.selectedPlugins.database
        );

        wellKnownData.plugins.validation = getSerialisablePlugin(
            metadata.selectedPlugins.validation
        );

        for (const assetCategory of fileCategories) {
            wellKnownData.plugins.storage[assetCategory] =
                getSerialisablePlugin(
                    metadata.selectedPlugins.storage[assetCategory]
                );
        }
    }

    async run({res}: RoutedRequestContext): Promise<void> {
        await setJson(res, 200, wellKnownData);
    }
}
