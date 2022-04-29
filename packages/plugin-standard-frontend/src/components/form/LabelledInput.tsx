import {IdProvider, ValidationProvider} from "@radiantguild/form-contexts";
import {ReactElement, ReactNode} from "react";
import {ValidationIndicator} from "~/components/ValidationIndicator";
import {LinkedLabel} from "~/components/form/LinkedLabel";
import {styled} from "~/stitches.config";

const Container = styled("div", {
    display: "flex",
    flexDirection: "column",
    gap: "$2",
    alignItems: "stretch"
});

Container.displayName = "Container";

const Label = styled(LinkedLabel, {
    fontSize: "0.8rem",
    fontWeight: "bold",
    flexGrow: 1
});

Label.displayName = "Label";

const LabelContainer = styled("div", {
    display: "flex",
    flexDirection: "row",
    gap: "$4"
})

LabelContainer.displayName = "LabelContainer";

const InputContainer = styled("div", {
    display: "flex",
    "> :first-child": {
        width: "100%"
    }
});

InputContainer.displayName = "InputContainer";

export interface LabelledInputProps {
    label: string;
    children: ReactNode;
    className?: string;
}

export function LabelledInput({label, className, children}: LabelledInputProps): ReactElement {
    return (
        <IdProvider>
            <ValidationProvider>
                <Container className={className}>
                    <LabelContainer>
                        <Label>{label}</Label>
                        <ValidationIndicator />
                    </LabelContainer>
                    <InputContainer>
                        {children}
                    </InputContainer>
                </Container>
            </ValidationProvider>
        </IdProvider>
    )
}
