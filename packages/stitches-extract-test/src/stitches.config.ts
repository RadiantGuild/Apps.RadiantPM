import {createStitchesExtract} from "@radiantpm/stitches-extract";

export const {theme, styled} = createStitchesExtract({
    tokens: {
        colors: {
            whiteAlpha50: "rgba(255, 255, 255, 0.04)",
            grey50: "#F7FAFC"
        },
        fonts: {
            text: "InterVariable, apple-system, sans-serif",
            monospace: "JetBrains Mono, monospace"
        },
        space: {
            1: "5px",
            2: "10px",
            3: "15px"
        },
        radii: {
            md: "5px",
            lg: "10px"
        }
    },
    helpers: {
        borderTopRadius: value => ({
            borderTopLeftRadius: value,
            borderTopRightRadius: value
        })
    },
    themes: {
        light: {
            colors: {
                background: "$grey50"
            }
        },
        dark: {
            colors: {
                background: "$grey800"
            }
        }
    }
});
