import PluginBase from "../PluginBase";
import {ValidationScope} from "./ValidationScope";
import {Validator} from "./Validator";

export default interface ValidationPlugin extends PluginBase<"validation"> {
    /**
     * An identifier for this plugin, local to its `PluginExport`.
     */
    id: string;

    /**
     * Gets the validators for the specified validation scope.
     * If you also need to do validation that doesn't have an associated `Validator`, you don't need to specify it here.
     */
    getValidators(kind: ValidationScope): Validator[];

    /**
     * Gets the validators that should only be used on the client.
     * If the implementation doesn't supply this function, `getValidators` should be used instead.
     * @see getValidators
     */
    getClientValidators?(kind: ValidationScope): Validator[];

    /**
     * Gets the URL path that a client can send a POST request to, which points to middleware that validates that value.
     * The client must pass the value as the request body in plain text.
     * The middleware must return a JSON object that follows `ValidationResponse`.
     *
     * The validation middleware must perform validation using the same validators as returned from `getValidators`,
     * although it can also do extra custom validation.
     * You can use the `getYoogiValidators` or `validate` functions from `@radiantpm/plugin-utils` to perform the validation.
     */
    getValidationUrl(kind: ValidationScope): string;
}
