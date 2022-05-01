import {createColumn, createMigrator, deleteColumn, modifyTable} from "../migration-runner";

export default createMigrator("D202205010134_Version_Metafile", {
    up: [
        modifyTable("packages", [
            createColumn("metafile", "text")
        ] as const)
    ] as const,
    down: [
        modifyTable("packages", [
            deleteColumn("metafile")
        ] as const)
    ] as const
});
