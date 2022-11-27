import {Options} from "tsup";

export const tsup: Options = {
    sourcemap: true,
    dts: true,
    clean: true,
    entry: {
        "index": "src/index.ts",
        "req-utils": "src/req-utils/index.ts",
        "web": "src/web.ts"
    },
    format: ["esm"]
};
