import stitchesExtract from "@radiantpm/stitches-extract/plugin";
import react from "@vitejs/plugin-react";
import {UserConfig} from "vite";
import inspect from "vite-plugin-inspect";

const config: UserConfig = {
    plugins: [
        react(),
        stitchesExtract(),
        inspect()
    ]
};

export default config;
