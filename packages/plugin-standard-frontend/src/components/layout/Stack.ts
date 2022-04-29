import {styled} from "~/stitches.config";

const Stack = styled("div", {
    display: "flex",
    variants: {
        direction: {
            column: {
                flexDirection: "column"
            },
            row: {
                flexDirection: "row"
            }
        }
    },
    defaultVariants: {
        direction: "column"
    }
});

export default Stack;
