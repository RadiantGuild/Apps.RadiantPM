import {useValidationSuspense} from "@radiantguild/form-contexts";
import {ReactElement} from "react";
import {InvalidValidationIndicator} from "./InvalidValidationIndicator";
import {ValidValidationIndicator} from "./ValidValidationIndicator";

export function ValidationIndicator(): ReactElement | null {
    const validateResult = useValidationSuspense();

    if (!validateResult) return null;

    if (validateResult.isValid) return <ValidValidationIndicator />;

    return <InvalidValidationIndicator message={validateResult.error.key} />
}
