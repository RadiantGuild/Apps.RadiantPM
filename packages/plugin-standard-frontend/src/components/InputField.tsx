import {
    AuthenticationField,
    AuthenticationLoginChangedResponse
} from "@radiantpm/plugin-types";
import {ChangeEvent, ReactElement, useCallback, useEffect, useState} from "react";
import {useAsyncAbortable} from "react-async-hook";
import {Text} from "~/components/text";
import {usePageContext} from "~/renderer/usePageContext";
import {styled} from "~/stitches.config";
import {useFormInput} from "~/utils/FormContext";

const Container = styled("div", {
    border: "1px solid $border",
    borderRadius: "$lg",
    paddingX: "1.2rem",
    paddingY: "1rem",
    display: "grid",
    gridTemplateAreas: "'label field' 'description description'",
    gridTemplateColumns: "auto 1fr",
    gap: "1rem 0.6rem",
    alignItems: "center"
});

Container.displayName = "Container";

const Label = styled(Text, {
    gridArea: "label"
});

Label.displayName = "Label";

const Input = styled("input", {
    gridArea: "field",
    background: "$backgroundDeep",
    border: "none",
    color: "$text",
    borderRadius: "$md",
    paddingX: "0.8rem",
    paddingY: "0.5rem",
    fontFamily: "$monospace",
    shadowBorder: "$colors$shadowBorder",
    variants: {
        isValid: {
            false: {
                shadowBorderColour: "$colors$statusError"
            }
        }
    }
});

Input.displayName = "Input";

const Description = styled(Text, {
    gridArea: "description",
    fontSize: "0.8rem",
    opacity: 0.8,
    "&:before": {
        content: " > "
    }
});

Description.displayName = "Description";

async function validateField(
    signal: AbortSignal,
    field: AuthenticationField,
    value: string,
    validationUrl?: string
) {
    if (!validationUrl) return true;

    const searchParams = new URLSearchParams({
        [field.name]: value
    });

    const url = `${validationUrl}?${searchParams}`;

    const result = await fetch(url, {signal}).then(
        res => res.json() as Promise<AuthenticationLoginChangedResponse>
    );

    return result.valid;
}

interface InputFieldProps {
    field: AuthenticationField;
}

export function InputField({field}: InputFieldProps): ReactElement {
    const {
        clientPlugins: {authentication: authPlugin}
    } = usePageContext();

    const formContext = useFormInput();

    const [value, setValue] = useState("");

    useEffect(() => {
        formContext.setValue(field.name, value);
    }, [field, value]);

    const {result: isValid} = useAsyncAbortable(
        validateField,
        [field, value, authPlugin.loginChangedUrl],
        {
            setLoading: state => ({...state, loading: true})
        }
    );

    const isValidBool = isValid || false;

    useEffect(() => {
        formContext.setValid(field.name, isValidBool);
    }, [field, isValidBool]);

    const handleChanged = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setValue(e.target.value);
        },
        [setValue]
    );

    return (
        <Container>
            <Label as="label" htmlFor={field.name}>
                {field.label}:
            </Label>
            <Input
                id={field.name}
                name={field.name}
                type={field.type}
                value={value}
                isValid={isValid}
                onChange={handleChanged}
            />
            <Description>{field.description}</Description>
        </Container>
    );
}
