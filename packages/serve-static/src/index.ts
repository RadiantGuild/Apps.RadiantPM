import {createHash} from "crypto";
import {createReadStream, existsSync, ReadStream} from "fs";
import {stat} from "fs/promises";
import {join, normalize, resolve} from "path";
import {createLogger} from "@radiantpm/log";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {RequestContext} from "@radiantpm/plugin-types";
import {fileTypeFromStream} from "file-type";
import {contentType, lookup as lookupMimeFromPath} from "mime-types";

const logger = createLogger("serve-static");

type ServeStaticFunction = (
    ctx: RequestContext,
    next: () => Promise<void>
) => Promise<void>;

interface ServeStaticOpts {
    /**
     * The root directory of the server. Files outside this directory will be blocked.
     */
    root: string;

    /**
     * If a file does not exist, attempt to resolve it with one of these extensions
     * @example
     * ["html", "htm"]
     * // example.com/home -> /home.html
     */
    defaultExtension?: string[];

    /**
     * If no file exists with the default extension, these files will be used inside the directory specified by the
     * path. (The first that exists will be used)
     * @example
     * ["index.html", "index.htm"]
     * // example.com/home -> /home/index.html
     */
    defaultFilename?: string[];

    /**
     * The mime type to return if one couldn't be detected
     * @default application/octet-stream
     */
    defaultMime?: string;

    /**
     * Use gzip compression if the client supports it. You must create gzipped versions of your files with the same name
     * plus `.gz` for this to work.
     */
    gzip?: boolean;

    /**
     * Can be a record mapping an error code to a file name or a function that takes an error code and returns a path
     * to the file
     */
    errorPages?: Record<number, string> | ((error: number) => string);
}

async function getFileType(
    path: string
): Promise<"file" | "directory" | false> {
    if (!existsSync(path)) return false;
    const stats = await stat(path);
    if (stats.isFile()) return "file";
    if (stats.isDirectory()) return "directory";
    return false;
}

async function isFile(path: string) {
    if (!existsSync(path)) return false;
    const stats = await stat(path);
    return stats.isFile();
}

function createDefaultReadStream(path: string) {
    return createReadStream(path, {
        flags: "r",
        mode: 438
    });
}

/**
 * Returns a read stream from the source
 * @param root The directory that the error file path is relative to
 * @param errorFile A string path, buffer contents, or file stream
 */
function getFileStream(root: string, errorFile: string) {
    return createDefaultReadStream(resolve(root, errorFile));
}

async function getContentType(fileContents: ReadStream, filePath: string) {
    // attempt to get the mime type from the file extension
    const pathMime = lookupMimeFromPath(filePath);

    if (pathMime) {
        const pathContentType = contentType(pathMime);
        if (pathContentType) return pathContentType;
    }

    const sourceMime = await fileTypeFromStream(fileContents);
    if (!sourceMime) return false;

    return contentType(sourceMime.mime);
}

function hash(source: string, algo: string) {
    return createHash(algo).update(source).digest("hex");
}

function parseDate(date: string | undefined) {
    if (!date) return undefined;
    return Date.parse(date);
}

export default function serveStatic(
    opts: ServeStaticOpts
): ServeStaticFunction {
    const root = normalize(resolve(opts.root));

    async function getFilePath(path: string) {
        const fileType = await getFileType(path);
        if (fileType === "file") return path;

        if (fileType === false) {
            for (const extension of opts.defaultExtension ?? []) {
                const testPath = `${path}.${extension}`;
                if (await isFile(testPath)) return testPath;
            }
        }

        if (fileType === "directory") {
            for (const child of opts.defaultFilename ?? []) {
                const testPath = `${path}/${child}`;
                if (await isFile(testPath)) return testPath;
            }
        }

        return false;
    }

    async function respondWithFile(
        ctx: RequestContext,
        fileContents: ReadStream,
        filePath: string
    ) {
        const stats = await stat(filePath);

        const etag =
            "W/" +
            hash(`${stats.ino}-${stats.size}-${stats.mtimeMs}`, "sha256");
        ctx.res.headers.set("etag", etag);
        ctx.res.headers.set("date", new Date().toUTCString());
        ctx.res.headers.set("last-modified", stats.mtime.toUTCString());
        ctx.res.headers.set("content-length", stats.size.toString());

        const clientMTime = parseDate(ctx.req.headers.get("if-modified-since"));
        const clientETag = ctx.req.headers.get("if-none-match");

        if (
            (clientMTime || clientETag) &&
            (!clientETag || clientETag === etag) &&
            (!clientMTime || clientMTime > stats.mtimeMs)
        ) {
            ctx.res.headers.deleteAll("content-encoding");
            ctx.res.headers.deleteAll("content-language");
            ctx.res.headers.deleteAll("content-length");
            ctx.res.headers.deleteAll("content-location");
            ctx.res.headers.deleteAll("content-md5");
            ctx.res.headers.deleteAll("content-range");
            ctx.res.headers.deleteAll("content-type");
            ctx.res.headers.deleteAll("expires");
            ctx.res.headers.deleteAll("last-modified");

            fileContents.close();
            const bodyResponse = await ctx.res.flushHeaders(304);
            return await bodyResponse.flushBody();
        }

        const bodyResponse = await ctx.res.flushHeaders(200);
        fileContents.pipe(bodyResponse.body);

        let resolve: () => void, reject: (err: Error) => void;

        const promise = new Promise<void>((yay, nay) => {
            resolve = yay;
            reject = nay;
        });

        function handleClose() {
            resolve();
        }

        function handleError(err: Error) {
            reject(err);
        }

        fileContents.on("close", handleClose);
        fileContents.on("error", handleError);

        await promise;

        fileContents.off("close", handleClose);
        fileContents.off("error", handleError);

        return await bodyResponse.flushBody();
    }

    async function respondMaybeWithGzip(
        ctx: RequestContext,
        fileContents: ReadStream,
        filePath: string
    ) {
        if (!ctx.req.headers.get("accept-encoding")?.includes("gzip")) {
            return await respondWithFile(ctx, fileContents, filePath);
        }

        const gzipPath = `${filePath}.gz`;

        if (!existsSync(gzipPath)) {
            return await respondWithFile(ctx, fileContents, filePath);
        }

        const stats = await stat(gzipPath);

        if (!stats.isFile()) {
            return await respondWithFile(ctx, fileContents, filePath);
        }

        // TODO: support other things setting the vary header
        ctx.res.headers.set("vary", "Accept-Encoding");
        ctx.res.headers.set("Content-Encoding", "gzip");

        return await respondWithFile(ctx, fileContents, filePath);
    }

    async function respond(
        ctx: RequestContext,
        fileContents: ReadStream,
        filePath: string
    ) {
        const contentTypeHeader =
            (await getContentType(fileContents, filePath)) ||
            (opts.defaultMime ?? "application/octet-stream");
        ctx.res.headers.set("content-type", contentTypeHeader);

        // TODO: make this configurable
        ctx.res.headers.set("cache-control", "max-age=3600");

        if (opts.gzip) {
            return await respondMaybeWithGzip(ctx, fileContents, filePath);
        } else {
            return await respondWithFile(ctx, fileContents, filePath);
        }
    }

    return async (ctx, next) => {
        if (ctx.req.method !== "GET") {
            throw new HttpError(409);
        }

        let decodedPath: string;

        try {
            decodedPath = decodeURIComponent(ctx.req.url.pathname);
        } catch {
            throw new HttpError(400, "Failed to decode request path");
        }

        const resolvedPath = resolve(join(root, decodedPath));

        if (!resolvedPath.startsWith(root)) {
            throw new HttpError(403, "Path is outside of the serve directory");
        }

        const filePath = await getFilePath(resolvedPath);

        if (filePath === false) {
            await next();
            return;
        }

        let stream: ReadStream;
        try {
            stream = getFileStream(root, filePath);
        } catch {
            await next();
            return;
        }

        await respond(ctx, stream, filePath);
    };
}
