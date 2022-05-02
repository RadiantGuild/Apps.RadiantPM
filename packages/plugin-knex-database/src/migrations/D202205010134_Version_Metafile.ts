import {createColumn, createMigrator, deleteColumn, modifyTable} from "../migration-runner";

export default createMigrator("D202205010134_Version_Metafile", {
    up: [
        modifyTable("versions", [
            createColumn("metafile", "text")
        ] as const)
    ] as const,
    down: [
        modifyTable("versions", [
            deleteColumn("metafile")
        ] as const)
    ] as const
});
