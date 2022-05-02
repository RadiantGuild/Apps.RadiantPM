import {readFile, writeFile} from "fs/promises";
import {resolve} from "path";
import {fileURLToPath} from "url";
import launchEditor from "launch-editor";

/**
 * Pads the number to two digits
 * @param {number} num
 * @returns {string}
 */
function padTimeNum(num) {
    return num.toString().padStart(2, "0");
}

/**
 * Formats the date as YYYYMMDDHHMM
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();

    return (
        year +
        padTimeNum(month) +
        padTimeNum(day) +
        padTimeNum(hour) +
        padTimeNum(minute)
    );
}

const migrationName = process.argv[2];

if (!migrationName || process.argv.length > 3) {
    console.log("usage: pnpm add-migration <name>");
    process.exit(1);
}

if (/\W/.test(migrationName)) {
    console.log("migration name must only contain word characters");
    process.exit(1);
}

if (/(?:^|_)[a-z\d]/.test(migrationName)) {
    console.log("each migration name word must start with a capital letter");
    process.exit(1);
}

const migrationId = "D" + formatDate(new Date()) + "_" + migrationName;

// language=typescript
const migrationSource = `import {createMigrator} from "../migration-runner";

export default createMigrator("${migrationId}", {
    up: [] as const,
    down: [] as const
});
`;

const thisFilePath = fileURLToPath(import.meta.url);
const migrationsDirectory = resolve(thisFilePath, "../../src/migrations");

const migrationPath = resolve(migrationsDirectory, `${migrationId}.ts`);
const listPath = resolve(migrationsDirectory, "index.ts");

await writeFile(migrationPath, migrationSource);

const listSource = await readFile(listPath, "utf8");

const NEXT_IMPORT_COMMENT = "/* [add script: NEXT IMPORT] */";
const NEXT_LIST_ITEM_COMMENT = "/* [add script: NEXT LIST ITEM] */";

// language=typescript
const listFilled = listSource
    .replace(NEXT_IMPORT_COMMENT, `import ${migrationId} from "./${migrationId}";
${NEXT_IMPORT_COMMENT}`)
    .replace(NEXT_LIST_ITEM_COMMENT, `,
    ${migrationId}${NEXT_LIST_ITEM_COMMENT}`);

await writeFile(listPath, listFilled);

launchEditor(migrationPath);
