import {ReactElement, useCallback} from "react";
import {Helmet} from "react-helmet-async";
import {ActionButton} from "~/components/form/ActionButton";
import {ActionButtons} from "~/components/form/ActionButtons";
import {Stack} from "~/components/layout";
import {Heading, Text} from "~/components/text";
import {usePageContext} from "~/renderer/usePageContext";
import {styled} from "~/stitches.config";

const MainContainer = styled(Stack, {
    gap: "1rem"
});

MainContainer.displayName = "MainContainer";

const Description = styled(Text, {
    gridArea: "description",
    fontSize: "0.8rem",
    opacity: 0.8,
    "&:before": {
        content: " > "
    }
});

Description.displayName = "Description";

export interface ConfirmPageProps {
    ssoDisplayName: string;
    returnUrl: string;
}

export function Page({
    ssoDisplayName,
    returnUrl
}: ConfirmPageProps): ReactElement {
    const {navigate} = usePageContext();

    const handleConfirm = useCallback(() => {
        location.assign(returnUrl);
    }, [returnUrl]);

    const handleCancel = useCallback(() => {
        navigate("/");
    }, [navigate]);

    return (
        <MainContainer>
            <Helmet>
                <title>Confirm account access</title>
            </Helmet>
            <Heading as="h2">Log in to {ssoDisplayName}</Heading>
            <Text>
                Are you sure you want to log in to {ssoDisplayName}? It will
                gain full access to your account.
            </Text>
            <Description>
                When you click allow, you will be redirected to:{" "}
                <code>{returnUrl}</code>
            </Description>
            <ActionButtons>
                <ActionButton isHero={true} onClick={handleConfirm}>
                    Allow access
                </ActionButton>
                <ActionButton isHero={false} onClick={handleCancel}>
                    Cancel
                </ActionButton>
            </ActionButtons>
        </MainContainer>
    );
}
