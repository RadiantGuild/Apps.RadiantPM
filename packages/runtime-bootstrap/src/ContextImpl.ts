import {join} from "path";
import {createLogger, RpmLogger} from "@radiantpm/log";
import Context from "./Context";
import {e} from "./constants";
import {exit, isExitError} from "./exit";
import {VariableReader} from "./variable-readers";
import EnvironmentVariableFileReader from "./variable-readers/EnvironmentVariableFileReader";
import EnvironmentVariableReader from "./variable-readers/EnvironmentVariableReader";
import JsonVariableReader from "./variable-readers/JsonVariableReader";
import PrefilledVariableReader from "./variable-readers/PrefilledVariableReader";

export default class ContextImpl implements Context {
    private readonly variableReaders: VariableReader[];

    private hasJsonPath = false;

    constructor(
        private readonly loggerName: string,
        private readonly jsonPath?: PrefilledVariableReader,
        private readonly runtimeType?: string
    ) {
        this.variableReaders = [
            new EnvironmentVariableReader(),
            new EnvironmentVariableFileReader()
        ];

        if ((jsonPath && !runtimeType) || (runtimeType && !jsonPath)) {
            throw new Error(
                "`jsonPath` and `runtimeType` must be specified together"
            );
        }
    }

    getLogger(name?: string): RpmLogger {
        if (name) {
            return createLogger(`${this.loggerName}:${name}`);
        } else {
            return createLogger(this.loggerName);
        }
    }

    async init(): Promise<void> {
        try {
            if (this.jsonPath) {
                const path = await this.jsonPath.read();

                if (path) {
                    const readerPath = join(path, this.runtimeType + ".json");
                    const variableReader = new JsonVariableReader(readerPath);
                    this.variableReaders.push(variableReader);
                    this.hasJsonPath = true;
                }
            }
        } catch (err) {
            if (isExitError(err)) throw err;
            exit(e.ERROR_CONTEXT_INIT_FAILURE);
        }
    }

    readOptionalConfig(key: string): Promise<string | undefined>;
    readOptionalConfig(key: string, def: string): Promise<string>;

    async readOptionalConfig(
        key: string,
        def?: string
    ): Promise<string | undefined> {
        try {
            for (const reader of this.variableReaders) {
                const id = reader.getId(key);
                const value = await reader.read(id);
                if (typeof value !== "undefined") return value;
            }
        } catch (err) {
            if (isExitError(err)) throw err;
            exit(e.ERROR_CONTEXT_CONF_READ_FAILURE);
        }

        if (def) return def;
        else return undefined;
    }

    async readRequiredConfig(
        key: string,
        description: string
    ): Promise<string> {
        const value = await this.readOptionalConfig(key);
        if (typeof value !== "undefined") return value;

        const variableReaderUsages = this.variableReaders.map(reader => {
            const id = reader.getId(key);
            return reader.getUsage(id);
        });

        const messageLines = [
            `Missing required configuration \`${key}\` (${description}).`,
            ...variableReaderUsages.map(usage => ` - ${usage}`)
        ];

        if (!this.hasJsonPath && this.jsonPath) {
            messageLines.push(
                ` - A JSON key in the file at \`[value of ${this.jsonPath.key}]/${this.runtimeType}.json\``
            );
        }

        throw new Error(messageLines.join("\n"));
    }
}
