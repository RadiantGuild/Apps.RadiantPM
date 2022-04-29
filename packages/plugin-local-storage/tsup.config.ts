import {Options} from "tsup";

export const tsup: Options = {
    sourcemap: true,
    dts: true,
    clean: true,
    entryPoints: ["src/index.ts"],
    format: ["esm"]
};
