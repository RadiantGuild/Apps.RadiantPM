import type {SimpleFeed} from "@radiantpm/plugin-types";
import {ReactElement} from "react";
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

const AddFeedLink = styled("a", {
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

AddFeedLink.displayName = "AddFeedLink";

export interface IndexPageProps {
    feeds: readonly SimpleFeed[];
    canAddFeeds: boolean;
}

export function Page({feeds, canAddFeeds}: IndexPageProps): ReactElement {
    return (
        <MainContainer>
            {feeds.length > 0 ? (
                feeds.map(feed => (
                    <DetailedLink key={feed.slug} href={`/feeds/${feed.slug}`}>
                        <Details>
                            <Heading as="h2">{feed.name}</Heading>
                            <SeparatedTextList level="sub">
                                <Code>{feed.slug}</Code>
                                <span>{feed.packagesCount} packages</span>
                            </SeparatedTextList>
                        </Details>
                    </DetailedLink>
                ))
            ) : (
                <Label level="sub">
                    Sorry, you don&rsquo;t have access to any feeds. You might
                    need to <Link href="/login">log in</Link>.
                </Label>
            )}
            {canAddFeeds && (
                <AddFeedLink href="/feeds/create">add feed</AddFeedLink>
            )}
        </MainContainer>
    );
}
