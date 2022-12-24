import {Options} from "tsup";

export const tsup: Options = {
    sourcemap: true,
    dts: true,
    clean: true,
    entry: ["src/index.ts"],
    format: ["esm"]
};
