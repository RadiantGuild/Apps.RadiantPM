import {createStitches} from "@stitches/react";
import {trans} from "~/stitches/utils/trans";

const space = {
    px: "1px",
    "0_5": "0.125rem",
    1: "0.25rem",
    "1_5": "0.375rem",
    2: "0.5rem",
    "2_5": "0.625rem",
    3: "0.75rem",
    "3_5": "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem"
};

export const {getCssText, theme, styled, keyframes, createTheme, globalCss} = createStitches({
    theme: {
        colors: {
            whiteAlpha50: "rgba(255, 255, 255, 0.04)",
            whiteAlpha100: "rgba(255, 255, 255, 0.06)",
            whiteAlpha200: "rgba(255, 255, 255, 0.08)",
            whiteAlpha300: "rgba(255, 255, 255, 0.16)",
            whiteAlpha400: "rgba(255, 255, 255, 0.24)",
            whiteAlpha500: "rgba(255, 255, 255, 0.36)",
            whiteAlpha600: "rgba(255, 255, 255, 0.48)",
            whiteAlpha700: "rgba(255, 255, 255, 0.64)",
            whiteAlpha800: "rgba(255, 255, 255, 0.80)",
            whiteAlpha900: "rgba(255, 255, 255, 0.92)",
            blackAlpha50: "rgba(0, 0, 0, 0.04)",
            blackAlpha100: "rgba(0, 0, 0, 0.06)",
            blackAlpha200: "rgba(0, 0, 0, 0.08)",
            blackAlpha300: "rgba(0, 0, 0, 0.16)",
            blackAlpha400: "rgba(0, 0, 0, 0.24)",
            blackAlpha500: "rgba(0, 0, 0, 0.36)",
            blackAlpha600: "rgba(0, 0, 0, 0.48)",
            blackAlpha700: "rgba(0, 0, 0, 0.64)",
            blackAlpha800: "rgba(0, 0, 0, 0.80)",
            blackAlpha900: "rgba(0, 0, 0, 0.92)",
            grey50: "#F7FAFC",
            grey100: "#EDF2F7",
            grey200: "#E2E8F0",
            grey300: "#CBD5E0",
            grey400: "#A0AEC0",
            grey500: "#718096",
            grey600: "#4A5568",
            grey700: "#2D3748",
            grey800: "#1A202C",
            grey900: "#171923",
            red50: "#FFF5F5",
            red100: "#FED7D7",
            red200: "#FEB2B2",
            red300: "#FC8181",
            red400: "#F56565",
            red500: "#E53E3E",
            red600: "#C53030",
            red700: "#9B2C2C",
            red800: "#822727",
            red900: "#63171B",
            orange50: "#FFFAF0",
            orange100: "#FEEBC8",
            orange200: "#FBD38D",
            orange300: "#F6AD55",
            orange400: "#ED8936",
            orange500: "#DD6B20",
            orange600: "#C05621",
            orange700: "#9C4221",
            orange800: "#7B341E",
            orange900: "#652B19",
            yellow50: "#FFFFF0",
            yellow100: "#FEFCBF",
            yellow200: "#FAF089",
            yellow300: "#F6E05E",
            yellow400: "#ECC94B",
            yellow500: "#D69E2E",
            yellow600: "#B7791F",
            yellow700: "#975A16",
            yellow800: "#744210",
            yellow900: "#5F370E",
            green50: "#F0FFF4",
            green100: "#C6F6D5",
            green200: "#9AE6B4",
            green300: "#68D391",
            green400: "#48BB78",
            green500: "#38A169",
            green600: "#2F855A",
            green700: "#276749",
            green800: "#22543D",
            green900: "#1C4532",
            teal50: "#E6FFFA",
            teal100: "#B2F5EA",
            teal200: "#81E6D9",
            teal300: "#4FD1C5",
            teal400: "#38B2AC",
            teal500: "#319795",
            teal600: "#2C7A7B",
            teal700: "#285E61",
            teal800: "#234E52",
            teal900: "#1D4044",
            blue50: "#ebf8ff",
            blue100: "#bee3f8",
            blue200: "#90cdf4",
            blue300: "#63b3ed",
            blue400: "#4299e1",
            blue500: "#3182ce",
            blue600: "#2b6cb0",
            blue700: "#2c5282",
            blue800: "#2a4365",
            blue900: "#1A365D",
            cyan50: "#EDFDFD",
            cyan100: "#C4F1F9",
            cyan200: "#9DECF9",
            cyan300: "#76E4F7",
            cyan400: "#0BC5EA",
            cyan500: "#00B5D8",
            cyan600: "#00A3C4",
            cyan700: "#0987A0",
            cyan800: "#086F83",
            cyan900: "#065666",
            purple50: "#FAF5FF",
            purple100: "#E9D8FD",
            purple200: "#D6BCFA",
            purple300: "#B794F4",
            purple400: "#9F7AEA",
            purple500: "#805AD5",
            purple600: "#6B46C1",
            purple700: "#553C9A",
            purple800: "#44337A",
            purple900: "#322659",
            pink50: "#FFF5F7",
            pink100: "#FED7E2",
            pink200: "#FBB6CE",
            pink300: "#F687B3",
            pink400: "#ED64A6",
            pink500: "#D53F8C",
            pink600: "#B83280",
            pink700: "#97266D",
            pink800: "#702459",
            pink900: "#521B41",
            selectionBackground: "rgba(0,181,216,0.25)"
        },
        fonts: {
            text: "InterVariable, apple-system, sans-serif",
            monospace: "JetBrains Mono, monospace"
        },
        space,
        sizes: {
            ...space,
            full: "100%"
        },
        radii: {
            sm: "3px",
            md: "5px",
            lg: "10px"
        }
    },
    utils: {
        borderTopRadius: (value: string | number) => ({
            borderTopLeftRadius: value,
            borderTopRightRadius: value
        }),
        borderBottomRadius: (value: string | number) => ({
            borderBottomLeftRadius: value,
            borderBottomRightRadius: value
        }),
        borderLeftRadius: (value: string | number) => ({
            borderTopLeftRadius: value,
            borderBottomLeftRadius: value
        }),
        borderRightRadius: (value: string | number) => ({
            borderTopRightRadius: value,
            borderBottomRightRadius: value
        }),
        paddingX: (value: string | number) => ({
            paddingLeft: value,
            paddingRight: value
        }),
        paddingY: (value: string | number) => ({
            paddingTop: value,
            paddingBottom: value
        }),
        marginX: (value: string | number) => ({
            marginLeft: value,
            marginRight: value
        }),
        marginY: (value: string | number) => ({
            marginTop: value,
            marginBottom: value
        }),
        shadowBorderColour: (colour: string) => ({
            $$shadowBorderColour: colour
        }),
        shadowBorder: (colour: string) => ({
            $$shadowBorderColour: colour,
            boxShadow: "inset 0 0 0 1px $$shadowBorderColour",
            "&:focus, &:focus-within": {
                outline: "none",
                boxShadow: "inset 0 0 0 2px $$shadowBorderColour"
            }
        }),
        focusedShadowBorder: (colour: string) => ({
            $$shadowBorderColour: colour,
            boxShadow: "inset 0 0 0 2px $$shadowBorderColour"
        }),
        ...trans
    }
});
