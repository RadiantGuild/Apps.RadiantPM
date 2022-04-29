import {AsyncValidationOptions} from "@radiantguild/yoogi";
import {ValidationScope, Validator} from "@radiantpm/plugin-types";
import {CustomValidator} from "./CustomValidator";

export interface CreateValidationPluginSource {
    /**
     * An identifier for this plugin, local to its `PluginExport`.
     */
    id: string;

    /**
     * Gets the validators for the specified validation scope.
     * If you also need to do validation, which doesn't have an associated `Validator`, you don't need to specify it here.
     */
    getValidators(kind: ValidationScope): (Validator | CustomValidator)[];

    /**
     * Async validation options to pass to Yoogi
     */
    validationOptions?: AsyncValidationOptions;
}
