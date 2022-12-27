const {resolve, dirname} = require("path");

const vitePluginSsrPath = dirname(require.resolve("vite-plugin-ssr"));
const loadBuildPath = resolve(vitePluginSsrPath, "./plugin/plugins/importBuild/loadBuild.js");
const {setLoaders} = require(loadBuildPath);

setLoaders({
    pageFiles: () => import("./server/pageFiles.js"),
    clientManifest: () => require("./client/manifest.json"),
    pluginManifest: () => require("./client/vite-plugin-ssr.json")
});
