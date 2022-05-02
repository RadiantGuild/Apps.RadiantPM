import {Knex} from "../knex-type";
import {runMigrations, Schema} from "../migration-runner";
import D202203041034_Init from "./D202203041034_Init";
import D202204300038_Package_Repository from "./D202204300038_Package_Repository";
import D202205010134_Version_Metafile from "./D202205010134_Version_Metafile";
/* [add script: NEXT IMPORT] */

// sort alphabetically to prevent merge conflicts
const migrations = [
    D202203041034_Init,
    D202204300038_Package_Repository,
    D202205010134_Version_Metafile/* [add script: NEXT LIST ITEM] */
] as const;

export type DatabaseSchema = Schema<typeof migrations>;

export async function migrate(knex: Knex): Promise<void> {
    await runMigrations(knex, migrations, "up");
}
