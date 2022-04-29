import {useInputState, UseInputStateProps} from "@radiantguild/form-contexts";
import {ReactElement} from "react";
import {styled} from "~/stitches.config";

const Input = styled("input", {
    padding: "$1 $2",
    backgroundColor: "$backgroundDeep",
    color: "$text",
    fontSize: "0.875rem",
    border: "none",
    outline: "none",
    shadowBorder: "$colors$shadowBorder",
    borderRadius: "3px"
});

Input.displayName = "Input";

export interface TextboxProps extends UseInputStateProps {
    type?: string;
    placeholder?: string;
    className?: string;
}

export function Textbox({
    type,
    placeholder,
    className,
    ...stateProps
}: TextboxProps): ReactElement {
    const {id, handleChange} = useInputState(stateProps);

    return (
        <Input
            id={id}
            type={type}
            placeholder={placeholder}
            className={className}
            onChange={handleChange}
        />
    );
}
