import SerialisablePluginBase from "../SerialisablePluginBase";
import {ValidationScope} from "./ValidationScope";
import {Validator} from "./Validator";

export type SerialisableValidators = {
    [Scope in ValidationScope]: Validator[];
};

export default interface SerialisableValidationPlugin extends SerialisablePluginBase<"validation"> {
    id: string;

    /**
     * The built-in validator that each scope uses, so that the client can run them.
     * Please make sure the implementation gives the same result as on the server.
     */
    validators: SerialisableValidators;
}
