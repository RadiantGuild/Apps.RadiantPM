import {createLogger} from "@radiantpm/log";
import {Knex, KnexTableBuilder} from "./knex-type";

const logger = createLogger("knex-migrator");

type ConstructorFunction<Returns, Params extends unknown[]> = (
    returns: Returns,
    table: KnexTableBuilder,
    name: string,
    ...params: Params
) => void;

type ConstructorObject = Record<
    string,
    ConstructorFunction<unknown, unknown[]>
>;

function createConstructorsHelper<T extends ConstructorObject>(v: T): T {
    return v;
}

const constructors = createConstructorsHelper({
    bigInteger: (returns: string, table, name) => table.bigInteger(name),
    tinyint: (returns: number, table, name, length: number) =>
        table.tinyint(name, length),
    smallint: (returns: number, table, name) => table.smallint(name),
    mediumint: (returns: number, table, name) => table.mediumint(name),
    bigint: (returns: number, table, name) => table.bigint(name),
    text: (returns: string, table, name) => table.text(name),
    string: (returns: string, table, name, length?: number) =>
        table.string(name, length),
    float: (returns: number, table, name) => table.float(name),
    double: (returns: number, table, name) => table.double(name),
    boolean: (returns: boolean, table, name) => table.boolean(name),
    date: (returns: Date, table, name) => table.date(name),
    datetime: (returns: Date, table, name) => table.datetime(name),
    time: (returns: Date, table, name) => table.time(name),
    timestamp: (returns: Date, table, name) => table.timestamp(name),
    binary: (returns: Buffer, table, name) => table.binary(name),
    json: (returns: unknown, table, name) => table.json(name),
    jsonb: (returns: unknown, table, name) => table.jsonb(name),
    uuid: (returns: string, table, name) => table.uuid(name)
});

type Constructors = typeof constructors;

type DataTypes = {
    [Key in keyof Constructors]: Constructors[Key] extends ConstructorFunction<
        infer Returns,
        infer Params
    >
        ? [Params, Returns]
        : never;
};

type DataType = keyof DataTypes;

type ConstructorFromName<Name extends DataType> = Constructors[Name];

type ConstructorParamsFromName<Name extends DataType> = DataTypes[Name][0];
type TypeFromName<Name extends DataType> = DataTypes[Name][1];

type Objects = "column" | "table" | "primary_key" | "foreign_key";

type Actions =
    // Creates a new instance of the object. If there was an old one, it will be overridden
    | "create"
    // Merges the children with an already existing object. Only valid if it actually has children
    | "merge"
    // Deletes an object
    | "delete"
    // Changes the name of an object to a new name
    | "rename";

export interface ObjectAction<
    Obj extends Objects,
    Action extends Actions,
    Name extends string
> {
    object: Obj;
    action: Action;
    name: Name;
}

type ObjectCreate<Obj extends Objects, Name extends string> = ObjectAction<
    Obj,
    "create",
    Name
>;

export interface DeepObjectCreate<
    Obj extends Objects,
    Name extends string,
    Children extends readonly ObjectAction<Objects, Actions, string>[]
> extends ObjectAction<Obj, "create", Name> {
    children: Children;
}

export interface ObjectMerge<
    Obj extends Objects,
    Name extends string,
    Children extends readonly ObjectAction<Objects, Actions, string>[]
> extends ObjectAction<Obj, "merge", Name> {
    children: Children;
}

type ObjectDelete<Obj extends Objects, Name extends string> = ObjectAction<
    Obj,
    "delete",
    Name
>;

export interface ObjectRename<
    Obj extends Objects,
    Name extends string,
    NewName extends string
> extends ObjectAction<Obj, "rename", Name> {
    newName: NewName;
}

type ColumnAction<Action extends Actions, Name extends string> = ObjectAction<
    "column",
    Action,
    Name
>;

export interface CreateColumn<Name extends string, Type extends DataType>
    extends ColumnAction<"create", Name> {
    construct: ConstructorFromName<Type>;
    params: ConstructorParamsFromName<Type>;
}

type DefaultCreateColumns = readonly CreateColumn<string, DataType>[];

export function createColumn<Name extends string, Type extends DataType>(
    name: Name,
    type: Type,
    ...params: ConstructorParamsFromName<Type>
): CreateColumn<Name, Type> {
    return {
        object: "column",
        action: "create",
        name,
        construct: constructors[type],
        params
    };
}

export type DeleteColumn<Name extends string> = ColumnAction<"delete", Name>;

export function deleteColumn<Name extends string>(
    name: Name
): DeleteColumn<Name> {
    return {
        object: "column",
        action: "delete",
        name
    };
}

export interface RenameColumn<Name extends string, NewName extends string>
    extends ColumnAction<"rename", Name> {
    newName: NewName;
}

export function renameColumn<Name extends string, NewName extends string>(
    name: Name,
    newName: NewName
): RenameColumn<Name, NewName> {
    return {
        object: "column",
        action: "rename",
        name,
        newName
    };
}

type AllColumnActions =
    | CreateColumn<string, DataType>
    | DeleteColumn<string>
    | RenameColumn<string, string>;

type PrimaryKeyAction<
    Action extends Actions,
    Name extends string
> = ObjectAction<"primary_key", Action, Name>;

export interface CreatePrimaryKey<
    Name extends string,
    ColumnName extends string[]
> extends PrimaryKeyAction<"create", Name> {
    columnName: ColumnName;
}

export function createPrimaryKey<
    Name extends string,
    ColumnName extends string[]
>(name: Name, ...columnName: ColumnName): CreatePrimaryKey<Name, ColumnName> {
    return {
        object: "primary_key",
        action: "create",
        name,
        columnName
    };
}

export type DeletePrimaryKey<Name extends string> = PrimaryKeyAction<
    "delete",
    Name
>;

export function deletePrimaryKey<Name extends string>(
    name: Name
): DeletePrimaryKey<Name> {
    return {
        object: "primary_key",
        action: "delete",
        name
    };
}

type AllPrimaryKeyActions =
    | CreatePrimaryKey<string, string[]>
    | DeletePrimaryKey<string>;

type ForeignKeyAction<
    Action extends Actions,
    Name extends string
> = ObjectAction<"foreign_key", Action, Name>;

export interface CreateForeignKey<
    Name extends string,
    Columns extends Record<string, string>,
    TargetTable extends string
> extends ForeignKeyAction<"create", Name> {
    columns: Columns;
    targetTable: TargetTable;
}

export function createForeignKey<
    Name extends string,
    ColumnName extends string,
    TargetTable extends string,
    TargetColumn extends string
>(
    name: Name,
    columnName: ColumnName,
    target: `${TargetTable}.${TargetColumn}`
): CreateForeignKey<Name, {[_ in ColumnName]: TargetColumn}, TargetTable> {
    const [targetTableName, targetColumnName] = target.split(".");

    return {
        object: "foreign_key",
        action: "create",
        name,
        columns: {
            [columnName]: targetColumnName
        } as {[_ in ColumnName]: TargetColumn},
        targetTable: targetTableName as TargetTable
    };
}

export function createCompositeForeignKey<
    Name extends string,
    Columns extends Record<string, string>,
    TargetTable extends string
>(
    name: Name,
    targetTable: TargetTable,
    columns: Columns
): CreateForeignKey<Name, Columns, TargetTable> {
    return {
        object: "foreign_key",
        action: "create",
        name,
        columns,
        targetTable
    };
}

export type DeleteForeignKey<Name extends string> = ForeignKeyAction<
    "delete",
    Name
>;

export function deleteForeignKey<Name extends string>(
    name: Name
): DeleteForeignKey<Name> {
    return {
        object: "foreign_key",
        action: "delete",
        name
    };
}

type AllForeignKeyActions =
    | CreateForeignKey<string, Record<string, string>, string>
    | DeleteForeignKey<string>;

type TableAction<Action extends Actions, Name extends string> = ObjectAction<
    "table",
    Action,
    Name
>;

export type CreateTable<
    Name extends string,
    Columns extends DefaultCreateColumns
> = DeepObjectCreate<"table", Name, Columns>;

type DefaultCreateTableNoArgs = CreateTable<string, DefaultCreateColumns>;

export function createTable<
    Name extends string,
    Columns extends DefaultCreateColumns
>(name: Name, columns: Columns): CreateTable<Name, Columns> {
    return {
        object: "table",
        action: "create",
        name,
        children: columns
    };
}

type ModifyTableChildren =
    | AllColumnActions
    | AllPrimaryKeyActions
    | AllForeignKeyActions;

export interface MergeTable<
    Name extends string,
    Children extends readonly ModifyTableChildren[]
> extends TableAction<"merge", Name> {
    children: Children;
}

type DefaultMergeTable = MergeTable<string, readonly ModifyTableChildren[]>;

export function modifyTable<
    Name extends string,
    Children extends readonly ModifyTableChildren[]
>(name: Name, actions: Children): MergeTable<Name, Children> {
    return {
        object: "table",
        action: "merge",
        name,
        children: actions
    };
}

export type DeleteTable<Name extends string> = TableAction<"delete", Name>;

export function deleteTable<Name extends string>(
    name: Name
): DeleteTable<Name> {
    return {
        object: "table",
        action: "delete",
        name
    };
}

export interface RenameTable<Name extends string, NewName extends string>
    extends TableAction<"rename", Name> {
    newName: NewName;
}

export function renameTable<Name extends string, NewName extends string>(
    name: Name,
    newName: NewName
): RenameTable<Name, NewName> {
    return {
        object: "table",
        action: "rename",
        name,
        newName
    };
}

type DefaultTableActions = readonly TableAction<Actions, string>[];
type AllTableActions =
    | CreateTable<string, DefaultCreateColumns>
    | MergeTable<string, readonly ModifyTableChildren[]>
    | DeleteTable<string>
    | RenameTable<string, string>;

type DefaultObjectAction = ObjectAction<Objects, Actions, string>;

type RenameProperty<
    T,
    OldName extends string,
    NewName extends string
> = OldName extends keyof T
    ? {
          [Key in keyof T as Key extends OldName ? NewName : Key]: T[Key];
      }
    : {
          [_ in NewName]: unknown;
      } &
          T;

type Cast<A, B> = A extends B ? A : never;

type BuildProperty<
    Action extends DefaultObjectAction,
    // eslint-disable-next-line @typescript-eslint/ban-types
    Init extends Record<string, ObjectCreate<Objects, string>> = {}
> = Action extends ObjectCreate<Objects, infer Name>
    ? {[N in Name]: Action} & Init
    : Action extends ObjectDelete<Objects, infer Name>
    ? Omit<Init, Name>
    : Action extends ObjectRename<Objects, infer Name, infer NewName>
    ? RenameProperty<Init, Name, NewName>
    : Action extends ObjectMerge<Objects, infer Name, infer Children>
    ? {
          [N in keyof Init]: N extends Name
              ? Init[Name] extends DeepObjectCreate<
                    infer ChildObj,
                    infer ChildName,
                    infer ChildChildren
                >
                  ? DeepObjectCreate<
                        ChildObj,
                        ChildName,
                        [...ChildChildren, ...Children]
                    >
                  : never
              : Init[N];
      }
    : never;

// interprets the sources and returns a Record<string, CreateAction>
type BuildObject<Sources extends ReadonlyArray<DefaultObjectAction>> =
    Sources extends readonly [...infer Rest, infer Source]
        ? BuildProperty<
              Cast<Source, DefaultObjectAction>,
              BuildObject<Cast<Rest, ReadonlyArray<DefaultObjectAction>>>
          >
        : Sources extends [infer Source]
        ? BuildProperty<Cast<Source, DefaultObjectAction>>
        : Sources extends readonly []
        ? // eslint-disable-next-line @typescript-eslint/ban-types
          {}
        : never;

export interface Migration<
    Name extends string,
    Steps extends DefaultTableActions
> {
    name: Name;
    steps: Steps;
}

export function createMigration<
    Name extends string,
    Steps extends DefaultTableActions
>(name: Name, steps: Steps): Migration<Name, Steps> {
    return {
        name,
        steps
    };
}

type MigrationList = ReadonlyArray<Migration<string, DefaultTableActions>>;

type MergeMigrations<Migrations extends MigrationList> =
    Migrations extends readonly [infer First, ...infer Rest]
        ? First extends Migration<string, infer Actions>
            ? readonly [
                  ...Actions,
                  ...MergeMigrations<Cast<Rest, MigrationList>>
              ]
            : never
        : [];

type MigrationsUpTo<
    Migrations extends MigrationList,
    Target extends string,
    Previous extends MigrationList = []
> = Migrations extends readonly [infer First, ...infer Rest]
    ? First extends Migration<infer Name, DefaultTableActions>
        ? Name extends Target
            ? readonly [...Previous, First]
            : MigrationsUpTo<
                  Cast<Rest, MigrationList>,
                  Target,
                  readonly [...Previous, First]
              >
        : never
    : [];

type MergeMigrationsResult<
    Migrations extends MigrationList,
    UpTo extends string | undefined = undefined
> = UpTo extends undefined
    ? MergeMigrations<Migrations>
    : MergeMigrations<MigrationsUpTo<Migrations, Cast<UpTo, string>>>;

function mergeMigrations<
    Migrations extends MigrationList,
    UpTo extends (Migrations[number]["name"] & string) | undefined = undefined
>(
    migrations: Migrations,
    upTo?: UpTo
): MergeMigrationsResult<Migrations, UpTo> {
    const steps: TableAction<Actions, string>[] = [];

    for (const migration of migrations) {
        steps.push(...migration.steps);
        if (migration.name === upTo) break;
    }

    return steps as MergeMigrationsResult<Migrations, UpTo>;
}

type InternalKeyPrefix = "##FAKE_AND_INTERNAL_DO_NOT_USE##";
type PkPrefix = `${InternalKeyPrefix}PK##`;
type FkPrefix = `${InternalKeyPrefix}FK##`;

type AddOptional<T extends Record<string, [boolean, unknown]>> = {
    [Key in keyof T as T[Key] extends [false, unknown]
        ? Key
        : never]: T[Key] extends [boolean, infer V] ? V : never;
} &
    {
        [Key in keyof T as T[Key] extends [true, unknown]
            ? Key
            : never]?: T[Key] extends [boolean, infer V] ? V : never;
    };

type KeyName<
    Key extends string,
    Value extends ObjectCreate<Objects, string>
> = Value extends CreatePrimaryKey<string, string[]>
    ? `${PkPrefix}${Key}`
    : Value extends CreateForeignKey<string, Record<string, string>, string>
    ? `${FkPrefix}${Key}`
    : Key;

// Maps a CreateColumn into the TS type of the column
type MapColumnTypes<Obj extends Record<string, ObjectCreate<Objects, string>>> =
    AddOptional<
        {
            [Name in keyof Obj as KeyName<
                Cast<Name, string>,
                Obj[Name]
            >]: Obj[Name] extends CreateColumn<string, infer TypeName>
                ? [false, TypeFromName<TypeName>]
                : [true, never];
        }
    >;

// Interprets each table's actions to get their columns as normal TS objects
type MapActions<Obj extends Record<string, TableAction<Actions, string>>> = {
    [TableName in keyof Obj]: Obj[TableName] extends DeepObjectCreate<
        Objects,
        string,
        infer Children
    >
        ? MapColumnTypes<BuildObject<Children>>
        : never;
};

// Interprets a list of actions into an object of tables using normal TS types
export type StaticTables<Actions extends ReadonlyArray<DefaultObjectAction>> =
    MapActions<BuildObject<Actions>>;

export interface Migrator<
    Name extends string,
    Up extends DefaultTableActions,
    Down extends DefaultTableActions
> {
    name: Name;
    up: Migration<Name, Up>;
    down: Migration<Name, Down>;
}

interface CreateMigratorParam<
    Up extends DefaultTableActions,
    Down extends DefaultTableActions
> {
    up: Up;
    down: Down;
}

type ColumnActionsWithNames<Names extends string> =
    // create needs to use tables that don't already exist, but unfortunately
    // you can't express that in TS typings so the types have to be a bit looser
    | CreateColumn<string, DataType>
    | DeleteColumn<Names>
    | RenameColumn<Names, string>
    // note: column name here has the same issue as above
    | CreatePrimaryKey<
          Names extends `${PkPrefix}${infer Name}` ? Name : never,
          string[]
      >
    | DeletePrimaryKey<Names extends `${PkPrefix}${infer Name}` ? Name : never>
    // note: column and table name here has the same issue as above
    | CreateForeignKey<
          Names extends `${FkPrefix}${infer Name}` ? Name : never,
          Record<string, string>,
          string
      >
    | DeleteForeignKey<Names extends `${FkPrefix}${infer Name}` ? Name : never>;

type MergeTableFollowingSchema<
    Schema extends Record<string, Record<string, unknown>>
> = {
    [TableName in Cast<keyof Schema, string>]: MergeTable<
        TableName,
        readonly ColumnActionsWithNames<Cast<keyof Schema[TableName], string>>[]
    >;
}[Cast<keyof Schema, string>];

type TableActionFollowingSchema<
    Schema extends Record<string, Record<string, unknown>>
> =
    | CreateTable<Cast<keyof Schema, string>, DefaultCreateColumns>
    | MergeTableFollowingSchema<Schema>
    | DeleteTable<Cast<keyof Schema, string>>
    | RenameTable<Cast<keyof Schema, string>, string>;

type TableActionsFollowingSchema<
    Schema extends Record<string, Record<string, unknown>>
> = readonly TableActionFollowingSchema<Schema>[];

export function createMigrator<
    Name extends string,
    Up extends DefaultTableActions,
    Down extends TableActionsFollowingSchema<StaticTables<Up>>
>(
    name: Name,
    {up, down}: CreateMigratorParam<Up, Down>
): Migrator<Name, Up, Down> {
    return {
        name,
        up: createMigration(name, up),
        down: createMigration(name, down)
    };
}

type DefaultMigrator = Migrator<
    string,
    DefaultTableActions,
    DefaultTableActions
>;

type DefaultMigratorArray = ReadonlyArray<DefaultMigrator>;

type MigratorsToMigrations<
    Migrators extends DefaultMigratorArray,
    Direction extends "up" | "down"
> = Migrators extends readonly [infer First, ...infer Rest]
    ? [
          Cast<First, DefaultMigrator>[Direction],
          ...MigratorsToMigrations<Cast<Rest, DefaultMigratorArray>, Direction>
      ]
    : [];

type Reverse<T extends unknown[]> = T extends [infer First, ...infer Rest]
    ? [...Reverse<Rest>, First]
    : [];

/**
 * Interprets the migrators to build the type of the schema that they generate,
 * which is an object where each property is a table, and each value is that
 * table's schema as a normal object.
 *
 * @example
 * Schema<typeof migrators, "up", "202204200609_Nice"> // -> {feeds: {...}, ...}
 */
export type Schema<
    Migrators extends DefaultMigratorArray,
    Direction extends "up" | "down" = "up",
    UpTo extends (Migrators[number]["name"] & string) | undefined = undefined
> = StaticTables<
    MergeMigrationsResult<
        Direction extends "down"
            ? Reverse<MigratorsToMigrations<Migrators, Direction>>
            : MigratorsToMigrations<Migrators, Direction>,
        UpTo
    >
>;

async function runCreateTable(knex: Knex, action: DefaultCreateTableNoArgs) {
    logger.trace("Creating table %s", action.name);
    await knex.schema.createTable(action.name, builder => {
        for (const step of action.children) {
            logger.trace(
                "Creating column %s (%s) in %s",
                step.name,
                step.construct.name,
                action.name
            );

            step.construct(
                null as never,
                builder,
                step.name,
                ...(step.params as [never])
            );
        }
    });
}

async function runUpdateTable(knex: Knex, action: DefaultMergeTable) {
    logger.trace("Modifying table %s", action.name);

    await knex.schema.table(action.name, builder => {
        for (const step of action.children) {
            switch (step.object) {
                case "column":
                    switch (step.action) {
                        case "create":
                            logger.trace(
                                "Adding column %s (%s) to %s",
                                step.name,
                                step.construct.name,
                                action.name
                            );
                            step.construct(
                                null as never,
                                builder,
                                step.name,
                                ...(step.params as [never])
                            );
                            break;
                        case "delete":
                            logger.trace(
                                "Removing column %s from %s",
                                step.name,
                                action.name
                            );
                            builder.dropColumn(step.name);
                            break;
                        case "rename":
                            logger.trace(
                                "Renaming column %s in %s to %s",
                                step.name,
                                action.name,
                                step.newName
                            );
                            builder.renameColumn(step.name, step.newName);
                            break;
                    }
                    break;
                case "primary_key":
                    switch (step.action) {
                        case "create":
                            logger.trace(
                                "Creating primary key %s on %s in %s",
                                step.name,
                                step.columnName,
                                action.name
                            );
                            builder.primary(
                                Array.isArray(step.columnName)
                                    ? step.columnName
                                    : [step.columnName],
                                {
                                    constraintName: step.name
                                }
                            );
                            break;
                        case "delete":
                            logger.trace(
                                "Removing primary key %s from %s",
                                step.name,
                                action.name
                            );
                            builder.dropPrimary(step.name);
                            break;
                    }
                    break;
                case "foreign_key":
                    switch (step.action) {
                        case "create":
                            logger.trace(
                                "Creating foreign key %s in %s referring %s",
                                step.name,
                                action.name,
                                Object.entries(step.columns)
                                    .map(
                                        ([column, reference]) =>
                                            `${column} to ${reference}`
                                    )
                                    .join(", ")
                            );
                            builder
                                .foreign(Object.keys(step.columns), step.name)
                                .references(Object.values(step.columns))
                                .inTable(step.targetTable);
                            break;
                        case "delete":
                            logger.trace(
                                "Removing foreign key %s from %s",
                                step.name,
                                action.name
                            );
                            builder.dropForeign([], step.name);
                            break;
                    }
                    break;
            }
        }
    });
}

function* allBefore<T>(
    src: Iterable<T>,
    test: (v: T) => boolean,
    inclusive = false
): Iterable<T> {
    for (const item of src) {
        if (test(item)) {
            if (inclusive) yield item;
            break;
        } else {
            yield item;
        }
    }
}

export async function runMigrations<Migrators extends DefaultMigratorArray>(
    knex: Knex,
    migrators: Migrators,
    direction: "up" | "down" = "up",
    upTo?: Migrators[number]["name"]
): Promise<void> {
    const migrations = migrators.map(migrator => migrator[direction]);
    if (direction === "up") migrations.reverse();

    await knex.schema.createTableIfNotExists("__migrations", table => {
        table.string("name");
    });

    const currentMigration = await knex<{name: string}>("__migrations").first(
        "name"
    );

    const migrationsToRun = Array.from(
        allBefore(migrations, ({name}) => name === currentMigration?.name)
    ).reverse();

    const merged = mergeMigrations(
        migrationsToRun,
        upTo
    ) as readonly AllTableActions[];

    const newMigrationName = upTo ?? migrations.at(-1)!.name;

    if (currentMigration) {
        await knex<{name: string}>("__migrations").update(
            "name",
            newMigrationName
        );
    } else {
        await knex<{name: string}>("__migrations").insert({name: newMigrationName})
    }

    logger.trace("Running %s actions to migrate", merged.length);
    for (const step of merged) {
        switch (step.action) {
            case "create":
                await runCreateTable(knex, step);
                break;
            case "merge":
                await runUpdateTable(knex, step);
                break;
            case "delete":
                await knex.schema.dropTable(step.name);
                break;
            case "rename":
                await knex.schema.renameTable(step.name, step.newName);
                break;
        }
    }
}
