import {resolve} from "path";
import react from "@vitejs/plugin-react";
import {UserConfig} from "vite";
import inspect from "vite-plugin-inspect";
import serverSideRendering from "vite-plugin-ssr/plugin";
import svgrPlugin from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

const config: UserConfig = {
    root: resolve(".."),
    plugins: [
        react(),
        serverSideRendering(),
        tsconfigPaths({root: ".."}),
        svgrPlugin(),
        inspect()
    ]
};

export default config;
