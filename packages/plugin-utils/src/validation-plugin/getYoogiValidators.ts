import {Validator as YoogiValidator} from "@radiantguild/yoogi";
import {Validator} from "@radiantpm/plugin-types";
import {CustomValidator} from "./CustomValidator";

interface ValidatorCreator {
    (validator: Validator | CustomValidator): YoogiValidator;
}

type ValidatorCreators = {
    [Kind in (Validator | CustomValidator)["kind"]]: (
        validator: (Validator | CustomValidator) & {kind: Kind}
    ) => YoogiValidator;
};

const validatorCreators: ValidatorCreators = {
    len_min(validator) {
        return {
            errorMessage: `Must be at least ${validator.minimumLength} characters`,
            validate(source) {
                return source.length >= validator.minimumLength;
            }
        };
    },
    len_max(validator) {
        return {
            errorMessage: `Must be less than ${
                validator.maximumLength + 1
            } characters`,
            validate(source) {
                return source.length <= validator.maximumLength;
            }
        };
    },
    trimmed() {
        return {
            errorMessage: "Must not start or end with whitespace",
            validate(source) {
                return source === source.trim();
            }
        };
    },
    url() {
        return {
            errorMessage:
                "Must only contain letters, numbers, dashes, and underscores",
            validate(source) {
                return !/[^\w-]/.test(source);
            }
        };
    },
    req(validator) {
        return {
            isAsync: true,
            errorMessage: validator.message,
            async validate(source): Promise<boolean> {
                const result = await fetch(validator.path, {
                    method: "POST",
                    body: source,
                    headers: {
                        "content-type": "text/plain"
                    }
                });

                return result.status === 201;
            }
        };
    },
    custom(validator) {
        return {
            isAsync: true,
            errorMessage: validator.message,
            async validate(source): Promise<boolean> {
                return await validator.validate(source);
            }
        };
    }
};

/**
 * Converts each RadiantPM built-in validator into Yoogi validators
 * @param validators
 */
export default function getYoogiValidators(
    validators: (Validator | CustomValidator)[]
): YoogiValidator[] {
    return validators.map(getYoogiValidator);
}

/**
 * Converts a RadiantPM built-in validator into a Yoogi validator
 */
export function getYoogiValidator(
    validator: Validator | CustomValidator
): YoogiValidator {
    const creator = validatorCreators[validator.kind] as ValidatorCreator;
    return creator(validator);
}
