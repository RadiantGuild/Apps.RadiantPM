import {Validator} from "@radiantguild/yoogi";
import {ValidationScope} from "@radiantpm/plugin-types";
import {getYoogiValidators} from "@radiantpm/plugin-utils/web";
import {useMemo} from "react";
import {usePageContext} from "~/renderer/usePageContext";

/**
 * Returns the validators under the specified scope, converted to Yoogi so `useValidation` can use them
 */
export default function useValidators(scope: ValidationScope): Validator[] {
    const {
        clientPlugins: {validation}
    } = usePageContext();

    const validators = useMemo(() => {
        return validation.validators[scope];
    }, [scope]);

    return useMemo(() => getYoogiValidators(validators), [validators]);
}
