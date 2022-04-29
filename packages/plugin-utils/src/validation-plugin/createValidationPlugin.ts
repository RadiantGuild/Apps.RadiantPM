import assert from "assert";
import {
    FailedValidationResult,
    Plugin,
    SuccessfulValidationResult,
    ValidationPlugin,
    ValidationScope,
    Validator
} from "@radiantpm/plugin-types";
import urljoin from "url-join";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "../middleware-routing";
import {getText, setError, setJson} from "../req-utils";
import {CreateValidationPluginSource} from "./CreateValidationPluginSource";
import {CustomValidator} from "./CustomValidator";
import validate from "./validate";

function getBuiltInUrl(scope: ValidationScope) {
    return urljoin("/-/validation/built-in", scope.replace(/\./g, "/"));
}

function getCustomUrl(scope: ValidationScope, index: number) {
    return urljoin(
        "/-/validation/custom",
        scope.replace(/\./g, "/"),
        index.toString()
    );
}

function convertCustomToReqValidator(
    plugin: CreateValidationPluginSource,
    scope: ValidationScope,
    validator: Validator | CustomValidator,
    index: number
): Validator {
    if (validator.kind !== "custom") return validator;

    return {
        kind: "req",
        message: validator.message,
        path: getCustomUrl(scope, index)
    };
}

class ValidationValidationPlugin implements ValidationPlugin {
    readonly type = "validation" as const;

    constructor(private readonly plugin: CreateValidationPluginSource) {}

    get id() {
        return this.plugin.id;
    }

    getValidationUrl(scope: ValidationScope): string {
        return getBuiltInUrl(scope);
    }

    getValidators(scope: ValidationScope): Validator[] {
        return this.plugin
            .getValidators(scope)
            .filter(validator => validator.kind !== "custom") as Validator[];
    }

    getClientValidators(scope: ValidationScope): Validator[] {
        return this.plugin
            .getValidators(scope)
            .map(convertCustomToReqValidator.bind(null, this.plugin, scope));
    }
}

class ValidationBuiltInMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor(private readonly plugin: CreateValidationPluginSource) {
        super(`POST /-/validation/built-in/[...scope]`);
    }

    async run({req, res, params}: RoutedRequestContext): Promise<void> {
        const scopeUrl = params.get("scope");
        assert(scopeUrl, "Missing scope parameter");
        const scope = scopeUrl.replace(/\//g, ".") as ValidationScope;

        const validators = this.plugin.getValidators(scope);

        if (!validators) {
            await setError(res, "Invalid validator scope");
            return;
        }

        const source = await getText(req);

        const validationResult = await validate(source, validators);

        if (!validationResult.isValid) {
            const failedResult: FailedValidationResult = {
                success: false,
                errorMessage: validationResult.error.key
            };

            await setJson(res, 400, failedResult);
            return;
        }

        const successfulResult: SuccessfulValidationResult = {
            success: true
        };

        await setJson(res, 200, successfulResult);
    }
}

class ValidationCustomMiddlewarePlugin extends RouteMiddlewarePlugin {
    constructor(private readonly plugin: CreateValidationPluginSource) {
        super(`POST /-/validation/custom/[...scope]/[index]`);
    }

    async run({req, res, params}: RoutedRequestContext): Promise<void> {
        const scopeUrl = params.get("scope") as ValidationScope | undefined;
        assert(scopeUrl, "Missing scope parameter");
        const scope = scopeUrl.replace(/\//g, ".") as ValidationScope;

        const indexStr = params.get("index");
        assert(indexStr, "Missing index parameter");

        const index = parseInt(indexStr);

        if (Number.isNaN(index)) {
            await setError(res, "Validator index is not a number");
            return;
        }

        const validators = this.plugin.getValidators(scope);

        if (!validators) {
            await setError(res, "Invalid validator scope");
            return;
        }

        const validator = validators[index];

        if (!validator || validator.kind !== "custom") {
            await setError(
                res,
                "No custom validator at the specified index",
                404
            );
            return;
        }

        const source = await getText(req);

        const isValid = await validator.validate(source);

        if (!isValid) {
            const failedResult: FailedValidationResult = {
                success: false,
                errorMessage: validator.message
            };

            await setJson(res, 400, failedResult);
            return;
        }

        const successfulResult: SuccessfulValidationResult = {
            success: true
        };

        await setJson(res, 200, successfulResult);
    }
}

/**
 * Handles the creation of middleware plugins for methods that a client needs to be able to call,
 * and running the built-in validators automatically.
 * @param plugin
 */
export default function createValidationPlugin(
    plugin: CreateValidationPluginSource
): Plugin[] {
    return [
        new ValidationValidationPlugin(plugin),
        new ValidationBuiltInMiddlewarePlugin(plugin),
        new ValidationCustomMiddlewarePlugin(plugin)
    ];
}
