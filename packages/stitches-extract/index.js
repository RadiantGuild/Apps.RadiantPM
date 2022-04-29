export function createStitchesExtract() {
    /* noop */
}

throw new Error(
    `You need to add the stitches-extract plugin to your Vite configuration:

// vite.config.ts
import stitchesExtract from "@radiantpm/stitches` +
        /* don't pass cursory checks */ +`-extract/plugin";
const config: UserConfig = {
    // ...
    stitchesExtract()
};

`
);
