import {throwMissingParameterError} from "./errors/MissingParameterError";

const regex = /\[([^]+?)]/g;

export interface FillTemplateResult<Keys extends string> {
    result: string;
    usedValues: ReadonlySet<Keys>;
}

/**
 * Replaces template parameters in the form `[paramName]` with the value of `params[paramName]`
 */
export default function fillTemplate<Keys extends string>(
    template: string,
    params: ReadonlyMap<Keys, string> | Record<Keys, string>
): FillTemplateResult<Keys> {
    const isMap = params instanceof Map;
    const usedValues = new Set<Keys>();

    const result = template.replace(regex, (_, name) => {
        const value = isMap ? params.get(name) : params[name];

        if (typeof value === "undefined") {
            throwMissingParameterError(name);
        }

        usedValues.add(name);
        return value;
    });

    return {
        result,
        usedValues
    };
}
