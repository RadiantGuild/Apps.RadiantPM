import {Options} from "tsup";

export const tsup: Options = {
    sourcemap: true,
    dts: true,
    clean: true,
    entryPoints: ["src/runtime/index.ts", "src/plugin/index.ts"],
    format: ["esm"]
};
