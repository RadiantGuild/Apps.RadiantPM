import Text from "./Text";
import {styled} from "~/stitches.config";

const Heading = styled(Text, {
    variants: {
        level: {
            standard: {
                fontSize: "22px",
                lineHeight: "28px",
                fontWeight: "700"
            },
            sub: {
                fontSize: "20px",
                lineHeight: "24px",
                fontWeight: "400"
            },
            minor: {
                fontSize: "15px",
                lineHeight: "20px",
                fontWeight: "700"
            }
        }
    },
    defaultVariants: {
        level: "standard"
    }
});

Heading.displayName = "Heading";

export default Heading;
