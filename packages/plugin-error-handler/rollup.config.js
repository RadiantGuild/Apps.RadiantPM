import json from "@rollup/plugin-json";
import {string} from "rollup-plugin-string";
import ts from "rollup-plugin-ts";

export default {
    input: ["src/index.ts", "src/http-error.ts"],
    output: {
        dir: "dist",
        format: "es"
    },
    plugins: [
        ts(),
        json(),
        string({
            include: ["**/*.html", "**/*.hbs"]
        })
    ]
};
