import {
    DatabasePlugin,
    EnvironmentMetadata,
    PluginExport,
    ValidationScope,
    Validator
} from "@radiantpm/plugin-types";
import {createValidationPlugin, CustomValidator} from "@radiantpm/plugin-utils";

let databasePlugin: DatabasePlugin;

const validators: {[Kind in ValidationScope]: (Validator | CustomValidator)[]} =
    {
        "feed.display-name": [
            {kind: "len_min", minimumLength: 4},
            {kind: "len_max", maximumLength: 48},
            {kind: "trimmed"}
        ],
        "feed.slug": [
            {kind: "len_min", minimumLength: 3},
            {kind: "len_max", maximumLength: 32},
            {kind: "trimmed"},
            {kind: "url"},
            {
                kind: "custom",
                message: "A feed with that slug already exists",
                async validate(slug: string): Promise<boolean> {
                    return !(await databasePlugin.hasFeedWithSlug(slug));
                }
            }
        ]
    };

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    provides: {
        validation: "validator"
    },

    init() {
        return createValidationPlugin({
            id: "validator",
            getValidators(
                kind: ValidationScope
            ): (Validator | CustomValidator)[] {
                return validators[kind];
            }
        });
    },

    onMetaLoaded(meta: EnvironmentMetadata) {
        databasePlugin = meta.selectedPlugins.database;
    }
};

export default pluginExport;
