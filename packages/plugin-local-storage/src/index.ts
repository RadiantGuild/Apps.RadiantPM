import {ok as assert} from "assert";
import {createReadStream, existsSync} from "fs";
import {readFile, writeFile} from "fs/promises";
import {join, resolve} from "path";
import {createLogger} from "@radiantpm/log";
import {
    fileCategories,
    FileCategory,
    PluginExport,
    StoragePlugin
} from "@radiantpm/plugin-types";
import {
    RoutedRequestContext,
    RouteMiddlewarePlugin
} from "@radiantpm/plugin-utils";
import {setError} from "@radiantpm/plugin-utils/req-utils";
import {async as hash, fromFile as hashFile} from "hasha";
import urljoin from "url-join";
import LocalStoragePluginConfig from "./LocalStoragePluginConfig";

const logger = createLogger("plugin-local-storage");

function getFilePath(hostPath: string, category: string, id: string) {
    category = category.replace(/[^a-z]+/gi, "-");
    id = id.replace(/[^a-z.]+/gi, "-");
    return resolve(join(hostPath, category, id));
}

async function handleRequest(
    config: LocalStoragePluginConfig,
    ctx: RoutedRequestContext
): Promise<void> {
    const category = ctx.params.get("category") as FileCategory;
    const id = ctx.params.get("id");

    assert(category, "`category` param is not set");
    assert(id, "`id` param is not set");

    if (!fileCategories.has(category)) {
        await setError(ctx.res, "Invalid category", 400);
        return;
    }

    const physicalPath = getFilePath(config.hostPath, category, id);

    logger.trace("Attempting to read asset from %s", physicalPath);

    if (!existsSync(physicalPath)) {
        await setError(ctx.res, "Asset does not exist", 404);
        return;
    }

    const bodyRes = await ctx.res.flushHeaders(200);

    const fileStream = createReadStream(physicalPath);
    fileStream.pipe(bodyRes.body);

    await new Promise((yay, nay) => {
        fileStream.on("end", yay);
        fileStream.on("error", nay);
    });

    await bodyRes.flushBody();
}

class FileRouteHandler extends RouteMiddlewarePlugin {
    private readonly config: Required<LocalStoragePluginConfig>;

    constructor(config: Required<LocalStoragePluginConfig>) {
        const url = urljoin(
            config.baseUrl,
            "[category]",
            "[id]"
        ) as `/${string}`;
        super(`GET ${url}`);
        this.config = config;
        logger.debug("Listening for package download requests at %s", url);
    }

    run(ctx: RoutedRequestContext): Promise<void> {
        return handleRequest(this.config, ctx);
    }
}

class LocalStorageStoragePlugin implements StoragePlugin {
    type = "storage" as const;
    id = "storage-plugin";

    readonly assetUrl: string;

    constructor(private readonly config: Required<LocalStoragePluginConfig>) {
        this.assetUrl = urljoin(this.config.baseUrl, "[category]", "[id]");
    }

    async read(category: FileCategory, id: string): Promise<Buffer> {
        const physicalPath = getFilePath(this.config.hostPath, category, id);

        return await readFile(physicalPath);
    }

    async write(category: FileCategory, content: Buffer): Promise<string> {
        const id = await hash(content, {
            algorithm: "sha256",
            encoding: "hex"
        });

        const physicalPath = getFilePath(this.config.hostPath, category, id);
        await writeFile(physicalPath, content);

        return id;
    }

    async hash(
        method: string,
        category: FileCategory,
        id: string
    ): Promise<string> {
        const physicalPath = getFilePath(this.config.hostPath, category, id);
        return await hashFile(physicalPath, {algorithm: method});
    }
}

const defaultConfig: Required<Omit<LocalStoragePluginConfig, "hostPath">> = {
    baseUrl: "/-/storage/"
};

const pluginExport: PluginExport<LocalStoragePluginConfig, true> = {
    configIsRequired: true,
    init(config: LocalStoragePluginConfig) {
        logger.debug("Hello, world!");

        const allConfig = {
            ...defaultConfig,
            ...config
        };

        return [
            new LocalStorageStoragePlugin(allConfig),
            new FileRouteHandler(allConfig)
        ];
    },
    provides: {
        storage: {
            pkg: "storage-plugin",
            static: "storage-plugin"
        }
    },
    configSchema: {
        type: "object",
        properties: {
            hostPath: {
                type: "string",
                description: "The physical path to store the files at"
            },
            baseUrl: {
                type: "string",
                description: "The base URL for requests",
                default: "/-/storage/",
                pattern: "^\\/",
                nullable: true
            }
        },
        required: ["hostPath"]
    }
};

export default pluginExport;
