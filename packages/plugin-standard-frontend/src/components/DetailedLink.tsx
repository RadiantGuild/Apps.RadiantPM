import {ReactElement, ReactNode} from "react";
import {Heading} from "~/components/text";
import {styled} from "~/stitches.config";

const Container = styled("div", {
    display: "flex",
    flexDirection: "row",
    gap: ".5rem",
    background: "$backgroundDeep",
    padding: "1rem",
    border: "1px solid $backgroundDeep",
    borderRadius: "$md"
});

Container.displayName = "Container";

const Link = styled("a", {
    color: "$text",
    textDecoration: "none",
    outline: "none",
    border: "none",
    [`&:focus > ${Container}`]: {
        borderColor: "$border"

    },
    [`&:hover ${Heading}, &:active ${Heading}`]: {
        textDecoration: "underline"
    }
});

Link.displayName = "Link";

export interface DetailedLinkProps {
    href: string;
    children: ReactNode;
}

export function DetailedLink({
    href,
    children
}: DetailedLinkProps): ReactElement {
    return (
        <Link href={href}>
            <Container>{children}</Container>
        </Link>
    );
}

export const Details = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: ".5rem"
});

Details.displayName = "Details";
