import Text from "./Text";
import {styled} from "~/stitches.config";

const Label = styled(Text, {
    fontWeight: "400",
    variants: {
        level: {
            standard: {
                fontSize: "1rem"
            },
            sub: {
                fontSize: "0.8rem",
                opacity: 0.8
            }
        },
        emphasis: {
            true: {
                fontWeight: 600
            }
        }
    },
    defaultVariants: {
        level: "standard"
    }
});

export default Label;
