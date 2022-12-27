import {copyFileSync, readFileSync, writeFileSync} from "fs";
import {dirname, resolve} from "path";
import {fileURLToPath} from "url";

const directory = dirname(fileURLToPath(import.meta.url));

console.log("[path-build] copying importBuild.cjs");
copyFileSync(
    resolve(directory, "./assets/importBuild.cjs"),
    resolve(directory, "../../dist/importBuild.cjs")
);

console.log("[patch-build] patching dist/server.js to load importBuild.cjs");
const buildServerPath = resolve(directory, "../../dist/server.js");
const buildServerSource = readFileSync(buildServerPath, "utf8");
writeFileSync(
    buildServerPath,
    `import "./importBuild.cjs";
${buildServerSource}`
);
