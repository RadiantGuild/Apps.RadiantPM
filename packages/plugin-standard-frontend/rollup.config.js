import ts from "rollup-plugin-ts";

export default {
    input: "src/server/index.ts",
    output: {
        file: "dist/server.js",
        format: "es"
    },
    plugins: [ts()]
};
