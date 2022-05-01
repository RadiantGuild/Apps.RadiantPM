import {FormProvider} from "@radiantguild/form-contexts";
import {ReactElement, useCallback, useState} from "react";
import {Helmet} from "react-helmet-async";
import {ActionButton} from "~/components/form/ActionButton";
import {ActionButtons} from "~/components/form/ActionButtons";
import {LabelledInput} from "~/components/form/LabelledInput";
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

const WideLabel = styled(LabelledInput, {
    flexGrow: 1
});

WideLabel.displayName = "WideLabel";

const CodeTextbox = styled(Textbox, {
    fontFamily: "$monospace",
    width: "300px !important"
});

CodeTextbox.displayName = "CodeTextbox";

export interface CreatePageProps {
    feedSlug: string;
    randomName: string;
    randomSlug: string;
}

async function createPackage(
    feedSlug: string,
    name: string,
    slug: string,
    description: string,
    type: string,
    repository: string | undefined
) {
    const {
        endpoints: {createPackage}
    } = await getWellKnown();

    const response = await fetchFromApi(createPackage, "POST", {
        body: {
            name,
            slug,
            description,
            type,
            repository
        },
        params: {
            feed_slug: feedSlug
        }
    });

    if (!response.success) {
        if (response.status === 409) {
            throw new Error("Package already exists");
        } else if (response.status === 403) {
            throw new Error("Not allowed to create package");
        } else {
            throw new Error("Failed to create package");
        }
    }
}

export function Page({
    feedSlug,
    randomName,
    randomSlug
}: CreatePageProps): ReactElement {
    const [displayName, setDisplayName] = useState<string>("");
    const [slug, setSlug] = useState<string>("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("");
    const [repository, setRepository] = useState("");

    const displayNameValidators = useValidators("feed.display-name");

    const forceCreateDisabled = slug.length === 0 ? true : undefined;

    const handleCreate = useCallback(
        () =>
            createPackage(
                feedSlug,
                displayName,
                slug,
                description,
                type,
                repository ? repository : undefined
            ),
        [feedSlug, displayName, slug, description, type, repository]
    );

    const {isLoading, execute} = useAsyncSuspense(handleCreate);

    return (
        <MainContainer>
            <Helmet>
                <title>Create a package</title>
            </Helmet>
            <Heading as="h2">Create a package</Heading>
            <FormProvider>
                <FieldsContainer>
                    <WideLabel label="Display name">
                        <Textbox
                            placeholder={randomName}
                            value={displayName}
                            validators={displayNameValidators}
                            onChange={setDisplayName}
                        />
                    </WideLabel>
                    <LabelledInput label="Slug">
                        <CodeTextbox
                            placeholder={randomSlug}
                            value={slug}
                            onChange={setSlug}
                        />
                    </LabelledInput>
                    <LabelledInput label="Repository (optional)">
                        <CodeTextbox
                            placeholder="git@github.com/my/repository"
                            value={repository}
                            onChange={setRepository}
                        />
                    </LabelledInput>
                </FieldsContainer>
                <FieldsContainer>
                    <WideLabel label="Description">
                        <Textbox
                            placeholder="An awesome package that does awesome things - just you wait"
                            value={description}
                            onChange={setDescription}
                        />
                    </WideLabel>
                    <LabelledInput label="Registry type">
                        {/* TODO: use a select input and verify that it is valid */}
                        <CodeTextbox
                            placeholder="npm"
                            value={type}
                            onChange={setType}
                        />
                    </LabelledInput>
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
