import {
    createColumn,
    createForeignKey,
    createMigrator,
    createPrimaryKey,
    createTable,
    deleteForeignKey,
    deletePrimaryKey,
    deleteTable,
    modifyTable
} from "../migration-runner";

export default createMigrator("202203041034_Init", {
    up: [
        createTable("feeds", [
            createColumn("id", "uuid"),
            createColumn("slug", "string"),
            createColumn("name", "string")
        ] as const),
        modifyTable("feeds", [createPrimaryKey("feeds_pk", "id")] as const),

        createTable("packages", [
            createColumn("id", "uuid"),
            createColumn("feed_id", "uuid"),
            createColumn("slug", "string"),
            createColumn("name", "string"),
            createColumn("type", "string"),
            createColumn("description", "text")
        ] as const),
        modifyTable("packages", [
            createPrimaryKey("packages_pk", "id"),
            createForeignKey("packages_feed_id_fk", "feed_id", "feeds.id")
        ] as const),

        createTable("versions", [
            createColumn("id", "uuid"),
            createColumn("package_id", "uuid"),
            createColumn("creation_date", "datetime"),
            createColumn("slug", "string"),
            createColumn("description", "text"),
            createColumn("asset_hash", "string"),
            createColumn("readme", "text"),
            createColumn("readme_type", "string")
        ] as const),
        modifyTable("versions", [
            createPrimaryKey("versions_pk", "id"),
            createForeignKey(
                "versions_package_id_fk",
                "package_id",
                "packages.id"
            )
        ] as const),

        createTable("package_tags", [
            createColumn("package_id", "uuid"),
            createColumn("tag", "string"),
            createColumn("version_id", "uuid")
        ] as const),
        modifyTable("package_tags", [
            createPrimaryKey("package_tags_pk", "package_id", "tag"),
            createForeignKey(
                "package_tags_package_id_fk",
                "package_id",
                "packages.id"
            ),
            createForeignKey(
                "package_tags_version_id_fk",
                "version_id",
                "versions.id"
            )
        ] as const)
    ] as const,
    down: [
        modifyTable("package_tags", [
            deleteForeignKey("package_tags_version_id_fk"),
            deleteForeignKey("package_tags_package_id_fk"),
            deletePrimaryKey("package_tags_pk")
        ] as const),
        deleteTable("package_tags"),

        modifyTable("versions", [
            deleteForeignKey("versions_package_id_fk"),
            deletePrimaryKey("versions_pk")
        ] as const),
        deleteTable("versions"),

        modifyTable("packages", [
            deleteForeignKey("packages_feed_id_fk"),
            deletePrimaryKey("packages_pk")
        ] as const),
        deleteTable("packages"),

        modifyTable("feeds", [deletePrimaryKey("feeds_pk")] as const),
        deleteTable("feeds")
    ] as const
});
