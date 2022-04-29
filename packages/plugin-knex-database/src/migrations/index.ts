import {Knex} from "../knex-type";
import {runMigrations, Schema} from "../migration-runner";
import D202203041034_Init from "./D202203041034_Init";

// sort alphabetically to prevent merge conflicts
const migrations = [D202203041034_Init] as const;

export type DatabaseSchema = Schema<typeof migrations>;

export async function migrate(knex: Knex): Promise<void> {
    await runMigrations(knex, migrations, "up");
}
