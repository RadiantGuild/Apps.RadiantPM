import {
    AsyncValidationOptions,
    CompleteValidateResult,
    validate as yoogiValidate
} from "@radiantguild/yoogi";
import {Validator} from "@radiantpm/plugin-types";
import {CustomValidator} from "./CustomValidator";
import getYoogiValidators from "./getYoogiValidators";

/**
 * Checks that a source is valid, according to the specified validators
 */
export default async function validate(
    source: string,
    validators: (Validator | CustomValidator)[],
    opts?: AsyncValidationOptions
): Promise<CompleteValidateResult> {
    const yoogiValidators = getYoogiValidators(validators);
    const result = yoogiValidate(source, yoogiValidators, opts);

    if (result.isLoading) return await result.promise;
    return result;
}
