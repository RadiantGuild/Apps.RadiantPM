import VariableReader from "./VariableReader";

export default class EnvironmentVariableReader implements VariableReader {
    getId(key: string): string {
        return key.toUpperCase();
    }

    getUsage(id: string): string {
        return `An environment variable with the name ${id}`;
    }

    read(id: string): Promise<string | undefined> {
        return Promise.resolve(process.env[id]);
    }
}
