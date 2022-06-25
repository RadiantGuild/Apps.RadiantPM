import {resolve} from "path";
import bootstrap from "@radiantpm/runtime-bootstrap";

console.log("Hello!");

process.env.RUNTIME_CONFIG_DIR = resolve("../init-config");
process.env.PLUGIN_CONFIGS_FILE = resolve("../plugin-configs.json");

bootstrap({
    pluginLoader: () => import("@radiantpm/runtime-standard-plugin-loader"),
    pluginSelector: () => import("@radiantpm/runtime-standard-plugin-selector"),
    backend: () => import("@radiantpm/runtime-standard-backend")
}).then(code => {
    if (code === 0) {
        console.log("Thank you and goodbye!");
    } else {
        console.log("Something went wrong, goodbye!");
    }

    process.exit(code);
});
