import {Options} from "tsup";

export default (options: Options): Options => {
    if (options.env?.TEST) {
        return {
            sourcemap: true,
            entryPoints: ["src/**/*.spec.ts"],
            format: ["esm"],
            outDir: "tmp/tests",
            external: ["ava"]
        };
    } else {
        return {
            sourcemap: true,
            dts: true,
            clean: true,
            entryPoints: ["src/index.ts"],
            format: ["esm"]
        };
    }
};
