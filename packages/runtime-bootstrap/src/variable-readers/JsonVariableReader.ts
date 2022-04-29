import {existsSync} from "fs";
import {readFile} from "fs/promises";
import VariableReader from "./VariableReader";

export default class JsonVariableReader implements VariableReader {
    constructor(private readonly path: string) {
    }

    getId(key: string): string {
        return key
            .toLowerCase()
            .replace(/([a-z])_([a-z])/gi, (_, a, b) => a + b.toUpperCase());
    }

    getUsage(id: string): string {
        return `A file located at ${this.path}, whose value is a JSON object containing the key ${id}`;
    }

    async read(id: string): Promise<string | undefined> {
        if (!existsSync(this.path)) return undefined;
        const text = await readFile(this.path, "utf8");
        const json = JSON.parse(text);
        return json[id];
    }
}
