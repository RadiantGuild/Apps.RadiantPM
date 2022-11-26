import {ReactElement} from "react";
import {Helmet} from "react-helmet-async";
import {Stack} from "~/components/layout";
import {Heading, Text} from "~/components/text";
import {styled} from "~/stitches.config";

const MainContainer = styled(Stack, {
    gap: "1rem"
});

MainContainer.displayName = "MainContainer";

export interface ConfirmPageProps {
    ssoDisplayName: string;
}

export function Page({ssoDisplayName}: ConfirmPageProps): ReactElement {
    return (
        <MainContainer>
            <Helmet>
                <title>Confirm account access</title>
            </Helmet>
            <Heading as="h2">Log in to {ssoDisplayName}</Heading>
            <Text>
                You should now be logged in to {ssoDisplayName}. You may close
                this tab.
            </Text>
        </MainContainer>
    );
}
