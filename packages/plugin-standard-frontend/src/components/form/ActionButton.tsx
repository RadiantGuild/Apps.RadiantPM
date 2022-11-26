import {useFormValidity} from "@radiantguild/form-contexts";
import {ReactElement, ReactNode} from "react";
import {Spinner} from "~/components/Spinner";
import {styled} from "~/stitches.config";

const Button = styled("button", {
    padding: "$2 $4",
    border: "none",
    borderRadius: "3px",
    minWidth: "100px",
    fontFamily: "$text",
    fontSize: "0.8rem",
    shadowBorder: "$colors$shadowBorder",
    variants: {
        hero: {
            true: {
                backgroundColor: "$heroButtonBackground",
                color: "$heroButtonText",
                "&:disabled": {
                    backgroundColor: "$heroButtonDisabledBackground"
                },
                "&:not(:disabled):hover": {
                    backgroundColor: "$heroButtonHoverBackground"
                }
            },
            false: {
                backgroundColor: "$buttonBackground",
                color: "$buttonText",
                "&:disabled": {
                    backgroundColor: "$buttonDisabledBackground"
                },
                "&:not(:disabled):hover": {
                    backgroundColor: "$buttonHoverBackground"
                }
            }
        }
    },
    defaultVariants: {
        hero: true
    }
});

Button.displayName = "Button";

export interface ActionButtonProps {
    isHero?: boolean;
    isDisabled?: boolean;
    isLoading?: boolean;
    children?: ReactNode;

    onClick?(): void;
}

export function ActionButton({
    isHero,
    isDisabled: overrideDisabled,
    isLoading,
    children,
    onClick
}: ActionButtonProps): ReactElement {
    const formIsValid = useFormValidity();
    const disabled = overrideDisabled ?? formIsValid ?? false;

    return (
        <Button hero={isHero} disabled={isLoading || disabled} onClick={onClick}>
            {isLoading ? (
                <Spinner />
            ) : children}
        </Button>
    );
}
