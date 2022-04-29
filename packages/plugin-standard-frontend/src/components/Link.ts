import {styled} from "~/stitches.config";

export const Link = styled("a", {
    color: "$link",
    textDecoration: "none",
    "&:hover, &:focus": {
        textDecoration: "underline",
        outline: "none"
    },
    "&:active": {
        color: "$linkActive"
    }
});
