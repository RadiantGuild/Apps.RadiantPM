import VariableReader from "./VariableReader";

export default class PrefilledVariableReader {
    constructor(
        public readonly key: string,
        private readonly reader: VariableReader
    ) {}

    async read(): Promise<string | undefined> {
        const id = this.reader.getId(this.key);
        return await this.reader.read(id);
    }
}
