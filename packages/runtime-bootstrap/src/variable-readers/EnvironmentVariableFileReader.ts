import {existsSync} from "fs";
import {readFile} from "fs/promises";
import EnvironmentVariableReader from "./EnvironmentVariableReader";
import VariableReader from "./VariableReader";

export default class EnvironmentVariableFileReader implements VariableReader {
    private envVarReader = new EnvironmentVariableReader();

    getId(key: string): string {
        return this.envVarReader.getId(key + "_file");
    }

    getUsage(id: string): string {
        return `An environment variable with the name ${id} whose value is the path to a file containing the value, encoded with UTF-8`;
    }

    async read(id: string): Promise<string | undefined> {
        const path = await this.envVarReader.read(id);
        if (typeof path === "undefined") return;

        if (!existsSync(path)) {
            throw new Error(`The file at the path specified in ${id} does not exist`);
        }

        return await readFile(path, "utf8");
    }
}
