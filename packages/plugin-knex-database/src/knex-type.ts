import {Knex as KnexType} from "knex";

export type Knex = KnexType<never, unknown[]>;
export type KnexConfig = KnexType.Config;
export type KnexTableBuilder = KnexType.TableBuilder;
