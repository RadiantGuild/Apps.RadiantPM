import {FormProvider} from "@radiantguild/form-contexts";
import {ReactElement, useCallback, useState} from "react";
import {Helmet} from "react-helmet-async";
import {ActionButton} from "~/components/form/ActionButton";
import {ActionButtons} from "~/components/form/ActionButtons";
import {LabelledInput} from "~/components/form/LabelledInput";
import {Select} from "~/components/form/Select";
import {Textbox} from "~/components/form/Textbox";
import {Stack} from "~/components/layout";
import {Heading} from "~/components/text";
import useAsyncSuspense from "~/hooks/useAsyncSuspense";
import useValidators from "~/hooks/useValidators";
import {styled} from "~/stitches.config";
import fetchFromApi from "~/utils/fetchFromApi";
import getWellKnown from "~/utils/getWellKnown";

const MainContainer = styled(Stack, {
    gap: "1rem"
});

MainContainer.displayName = "MainContainer";

const FieldsContainer = styled("div", {
    display: "flex",
    flexDirection: "row",
    gap: "$8"
});

FieldsContainer.displayName = "FieldsContainer";

const DisplayNameLabel = styled(LabelledInput, {
    flexGrow: 1
});

const SlugLabel = styled(LabelledInput, {
    flexShrink: 0,
    width: "300px"
});

export interface CreatePageProps {
    randomName: string;
    slugOptions: string[] | null;
}

async function createFeed(name: string, slug: string) {
    const {
        endpoints: {createFeed}
    } = await getWellKnown();

    const response = await fetchFromApi(createFeed, "POST", {
        body: {
            name,
            slug
        }
    });

    if (!response.success) {
        if (response.status === 409) {
            throw new Error("Feed already exists");
        } else if (response.status === 403) {
            throw new Error("Not allowed to create feed");
        } else {
            throw new Error("Failed to create feed");
        }
    }
}

export function Page({randomName, slugOptions}: CreatePageProps): ReactElement {
    const [displayName, setDisplayName] = useState<string>("");
    const [slug, setSlug] = useState<string>("");

    const displayNameValidators = useValidators("feed.display-name");

    const forceCreateDisabled = slug.length === 0 ? true : undefined;

    const handleCreate = useCallback(
        () => createFeed(displayName, slug),
        [displayName, slug]
    );

    const {isLoading, execute} = useAsyncSuspense(handleCreate);

    return (
        <MainContainer>
            <Helmet>
                <title>Create a feed</title>
            </Helmet>
            <Heading as="h2">Create a feed</Heading>
            <FormProvider>
                <FieldsContainer>
                    <DisplayNameLabel label="Display name">
                        <Textbox
                            placeholder={randomName}
                            value={displayName}
                            validators={displayNameValidators}
                            onChange={setDisplayName}
                        />
                    </DisplayNameLabel>
                    {slugOptions && (
                        <SlugLabel label="Slug">
                            <Select items={slugOptions} onChange={setSlug} />
                        </SlugLabel>
                    )}
                </FieldsContainer>
                <ActionButtons>
                    <ActionButton
                        isHero
                        isDisabled={forceCreateDisabled}
                        isLoading={isLoading}
                        onClick={execute}
                    >
                        Create
                    </ActionButton>
                </ActionButtons>
            </FormProvider>
        </MainContainer>
    );
}
