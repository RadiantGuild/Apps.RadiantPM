import type {Feed, SimplePackage} from "@radiantpm/plugin-types";
import {ReactElement} from "react";
import ReactTimeago from "react-timeago";
import {DetailedLink, Details} from "~/components/DetailedLink";
import {Link} from "~/components/Link";
import {SeparatedTextList} from "~/components/SeparatedTextList";
import {Heading, Label} from "~/components/text";
import {Code} from "~/components/text/Code";
import {styled} from "~/stitches.config";

const MainContainer = styled("div", {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: "$2"
});

MainContainer.displayName = "MainContainer";

const AddPackageLink = styled("a", {
    alignSelf: "center",
    color: "$text",
    opacity: 0.6,
    "&:hover": {
        opacity: 0.8
    },
    "&:focus": {
        opacity: 1
    }
});

AddPackageLink.displayName = "AddPackageLink";

export interface FeedPageProps {
    feed: Feed;
    packages: readonly SimplePackage[];
}

export function Page({feed, packages}: FeedPageProps): ReactElement {
    return (
        <>
            <h1>{feed.name}</h1>

            <MainContainer>
                {packages.length > 0 ? (
                    packages.map(pkg => (
                        <DetailedLink
                            key={pkg.slug}
                            href={`/feeds/${feed.slug}/packages/${pkg.slug}`}
                        >
                            <Details>
                                <Heading as="h2">{pkg.name}</Heading>
                                <SeparatedTextList level="sub">
                                    <Code>v{pkg.latestVersion}</Code>
                                    <Code>{pkg.versionsCount} versions</Code>
                                    {pkg.lastUpdated && (
                                        <span>
                                            Last updated{" "}
                                            <ReactTimeago
                                                date={pkg.lastUpdated}
                                            />
                                        </span>
                                    )}
                                </SeparatedTextList>
                            </Details>
                        </DetailedLink>
                    ))
                ) : (
                    <Label level="sub">
                        Sorry, you don&rsquo;t have access to any packages. You
                        might need to <Link href="/login">log in</Link>
                    </Label>
                )}

                <AddPackageLink href={`/feeds/${feed.slug}/packages/create`}>
                    add package
                </AddPackageLink>
            </MainContainer>
        </>
    );
}
