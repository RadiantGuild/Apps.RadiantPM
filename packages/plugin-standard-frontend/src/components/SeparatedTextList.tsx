import {Children, Fragment, ReactElement, ReactNode} from "react";
import {Label} from "./text";
import {styled} from "~/stitches.config";
import PropsOf from "~/utils/PropsOf";

const Container = styled(Label, {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: ".3rem"
});

Container.displayName = "Container";

const Separator = styled("span", {
    "&:before": {
        content: "·"
    }
});

Separator.displayName = "Separator";

interface BaseSeparatedTextListProps {
    children: ReactNode;
}

export type SeparatedTextListProps = PropsOf<typeof Container> &
    BaseSeparatedTextListProps;

export function SeparatedTextList({
    children,
    ...props
}: SeparatedTextListProps): ReactElement {
    return (
        <Container {...props}>
            {Children.map(children, (child, i) => (
                <Fragment key={i}>
                    {child}
                    {i < Children.count(children) - 1 && (
                        <Separator />
                    )}
                </Fragment>
            ))}
        </Container>
    );
}
