import {createColumn, createMigrator, deleteColumn, modifyTable} from "../migration-runner";

export default createMigrator("D202204300038_Package_Repository", {
    up: [
        modifyTable("packages", [
            createColumn("repository", "string")
        ] as const)
    ] as const,
    down: [
        modifyTable("packages", [
            deleteColumn("repository")
        ] as const)
    ] as const
});
