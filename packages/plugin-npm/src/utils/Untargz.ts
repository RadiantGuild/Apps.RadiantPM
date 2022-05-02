import assert from "assert";
import {PassThrough, Readable} from "stream";
import {promisify} from "util";
import {gunzip as gunzipCb} from "zlib";
import {extract, Headers} from "tar-stream";

const gunzip = promisify(gunzipCb);

export type FileTreeStat =
    | {
          type: "file";
          name: string;
          mtime: Date;
      }
    | {
          type: "dir";
          name: string;
      };

interface FileInit {
    data: Buffer;
    header: Headers;
}

export class FileTree {
    constructor(
        private readonly files: Map<string, FileInit>,
        private readonly prefix: string,
        private readonly caseInsensitive?: boolean
    ) {}

    getAbsolutePath(relativePath: string) {
        return this.prefix + relativePath;
    }

    entriesCount() {
        return this.filesCount() + this.dirsCount();
    }

    filesCount(): number {
        let count = 0;

        for (const entry of this.listEntries()) {
            if (entry.type !== "file") continue;

            count++;
        }

        return count;
    }

    dirsCount(): number {
        let count = 0;

        for (const entry of this.listEntries()) {
            if (entry.type !== "dir") continue;

            count++;
        }

        return count;
    }

    *listEntries(): IterableIterator<FileTreeStat> {
        const seenDirs = new Set<string>();

        for (const [
            path,
            {
                header: {mtime}
            }
        ] of this.files) {
            if (!path.startsWith(this.prefix)) continue;
            const relativePath = this.getCasedName(
                path.substring(0, this.prefix.length)
            );

            const sepIdx = relativePath.indexOf("/");

            if (sepIdx === -1) {
                assert(mtime, "Missing mtime on file");

                yield {
                    type: "file",
                    name: relativePath,
                    mtime
                };
            } else {
                const dir = relativePath.substring(0, sepIdx);
                if (seenDirs.has(dir)) continue;
                seenDirs.add(dir);

                yield {
                    name: dir,
                    type: "dir"
                };
            }
        }
    }

    /**
     * Checks if a file with the specified name exists
     */
    hasFile(name: string): boolean {
        return this.files.has(this.prefix + this.getCasedName(name));
    }

    /**
     * Returns a new `FileTree` filtered by the specified directory.
     *
     * If the directory doesn't exist, no error is thrown, instead `listFiles()` will return nothing.
     */
    getDir(name: string): FileTree {
        return new FileTree(
            this.files,
            this.prefix + this.getCasedName(name) + "/",
            this.caseInsensitive
        );
    }

    /**
     * Returns the buffer contents of the file at the specified location, or undefined if it doesn't exist
     */
    getFile(name: string): Buffer | undefined {
        const file = this.files.get(this.prefix + this.getCasedName(name));
        return file?.data;
    }

    /**
     * Returns the name of the first file that exists
     * @param names A list of names to check, in order
     */
    firstThatExists(names: string[]): string | undefined {
        return names.find(name => this.hasFile(name));
    }

    private getCasedName(name: string) {
        if (this.caseInsensitive) return name.toLowerCase();
        return name;
    }
}

export interface UntargzOptions {
    /**
     * If specified, only files whose paths are in this array are included
     */
    include?: string[];

    /**
     * If true, filenames won't be case sensitive.
     *
     * If used with `includes`, every path in `includes` must be in lower case.
     */
    caseInsensitive?: boolean;
}

export default class Untargz {
    private readonly extractor = extract();
    private readonly finishHandlers = new Set<() => void>();

    private readonly files = new Map<string, FileInit>();

    constructor(private readonly opts: UntargzOptions) {
        this.handleEntry = this.handleEntry.bind(this);
        this.handleFinish = this.handleFinish.bind(this);

        this.extractor.on("entry", this.handleEntry);
        this.extractor.on("finish", this.handleFinish);
    }

    static async fromBuffer(
        buffer: Buffer,
        opts: UntargzOptions = {}
    ): Promise<FileTree> {
        const reader = new Untargz(opts);
        const gunzippedBuffer = await gunzip(buffer);
        reader.readFromBuffer(gunzippedBuffer);
        await reader.wait();
        return reader.buildTree();
    }

    readFromBuffer(data: Buffer): void {
        this.extractor.write(data);
        this.extractor.end();
    }

    readFromStream(src: Readable): void {
        src.pipe(this.extractor);
    }

    wait(): Promise<void> {
        return new Promise(yay => {
            this.finishHandlers.add(yay);
        });
    }

    buildTree(): FileTree {
        return new FileTree(this.files, "", this.opts.caseInsensitive);
    }

    private async handleEntry(
        headers: Headers,
        stream: PassThrough,
        next: (err?: unknown) => void
    ) {
        try {
            await this.handleEntryAsync(headers, stream);
            next();
        } catch (err) {
            next(err);
        }
    }

    private async handleEntryAsync(headers: Headers, stream: PassThrough) {
        if (headers.type === "file") {
            const name = this.opts.caseInsensitive
                ? headers.name.toLowerCase()
                : headers.name;

            if (this.opts.include && !this.opts.include.includes(name)) {
                return;
            }

            const data: Buffer[] = [];

            stream.on("data", dat => data.push(dat));

            await new Promise<void>((yay, nay) => {
                stream.on("end", yay);
                stream.on("error", nay);
            });

            const buff = Buffer.concat(data);

            this.files.set(name, {
                header: headers,
                data: buff
            });
        } else {
            throw new Error("Unsupported entry type");
        }
    }

    private handleFinish() {
        for (const handler of this.finishHandlers) handler();
    }
}
