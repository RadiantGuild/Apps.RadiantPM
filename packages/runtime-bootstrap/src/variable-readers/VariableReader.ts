export default interface VariableReader {
    getId(key: string): string;
    read(id: string): Promise<string | undefined>;

    getUsage(id: string): string;
}
