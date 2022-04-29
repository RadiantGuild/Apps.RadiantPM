import type {
    AuthenticationField,
    AuthenticationLoginResponse
} from "@radiantpm/plugin-types";
import {ReactElement, useCallback} from "react";
import {useAsyncCallback} from "react-async-hook";
import {Helmet} from "react-helmet-async";
import {InputField} from "~/components/InputField";
import {ActionButton} from "~/components/form/ActionButton";
import {ActionButtons} from "~/components/form/ActionButtons";
import {Stack} from "~/components/layout";
import {Heading} from "~/components/text";
import {usePageContext} from "~/renderer/usePageContext";
import {styled} from "~/stitches.config";
import {FormContext, useFormButtons} from "~/utils/FormContext";

const MainContainer = styled(Stack, {
    gap: "1rem"
});

MainContainer.displayName = "MainContainer";

const FieldsContainer = styled(Stack, {
    gap: "$2"
});

FieldsContainer.displayName = "FieldsContainer";

async function logIn(
    url: string,
    fields: Record<string, string>
): Promise<AuthenticationLoginResponse> {
    const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(fields),
        headers: {
            accept: "application/json"
        }
    });

    return await response.json();
}

function useLogInCallback(fields: Record<string, string>) {
    const {
        clientPlugins: {authentication: authPlugin}
    } = usePageContext();
    const {execute, ...rest} = useAsyncCallback(logIn);

    const run = useCallback(() => {
        return execute(authPlugin.loginUrl, fields);
    }, [execute, fields, authPlugin]);

    return {...rest, execute: run};
}

export interface LoginPageProps {
    authDisplayName: string;
    fields: AuthenticationField[];
}

function LoginForm({authDisplayName, fields}: LoginPageProps): ReactElement {
    const form = useFormButtons();

    const {execute: doSubmit} = useLogInCallback(form.values);

    const handleSubmit = useCallback(async () => {
        const result = await doSubmit();

        const url = new URL(location.href);
        const returnUrl = url.searchParams.get("return") ?? "/";

        if (result.success) location.assign(returnUrl);
    }, [doSubmit]);

    return (
        <MainContainer>
            <Helmet>
                <title>Log in to {authDisplayName}</title>
            </Helmet>
            <Heading as="h2">Log in to {authDisplayName}</Heading>
            <FieldsContainer>
                {fields.map(field => (
                    <InputField key={field.name} field={field} />
                ))}
            </FieldsContainer>
            <ActionButtons>
                <ActionButton
                    isHero
                    isDisabled={form.invalidFields.length > 0}
                    onClick={handleSubmit}
                >
                    Log in
                </ActionButton>
            </ActionButtons>
        </MainContainer>
    );
}

export function Page({authDisplayName, fields}: LoginPageProps): ReactElement {
    return (
        <FormContext>
            <LoginForm authDisplayName={authDisplayName} fields={fields} />
        </FormContext>
    );
}
