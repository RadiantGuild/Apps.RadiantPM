import assert from "assert";
import {join} from "path";
import {Bucket, Storage} from "@google-cloud/storage";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
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
import hasha from "hasha";
import urljoin from "url-join";
import GcsStoragePluginConfig from "./GcsStoragePluginConfig";

const DEFAULT_BASE_URL = "/-/storage/";

class GcsHandler {
    readonly bucket: Bucket;
    private readonly gcsClient: Storage;

    constructor(private readonly config: GcsStoragePluginConfig) {
        this.gcsClient = new Storage({
            keyFilename: config.keyFilename
        });

        this.bucket = this.gcsClient.bucket(config.bucketName);
    }

    getFilePath(category: string, id: string) {
        id = id.replace(/[/.-]+/gi, "-");

        const {bucketBasePath} = this.config;
        if (!bucketBasePath) return join(category, id);
        return join(bucketBasePath, category, id);
    }

    async getExistingFile(category: FileCategory, id: string) {
        const path = this.getFilePath(category, id);
        const file = this.bucket.file(path);
        const [exists] = await file.exists();

        if (!exists) {
            throw new HttpError(404, `${category} asset does not exist`);
        }

        return file;
    }
}

class FileRouteHandler extends RouteMiddlewarePlugin {
    private readonly gcs: GcsHandler;

    constructor(config: GcsStoragePluginConfig) {
        const url = urljoin(
            config.baseUrl ?? DEFAULT_BASE_URL,
            "[category]",
            "[id]"
        ) as `/${string}`;

        super(`GET ${url}`);
        this.gcs = new GcsHandler(config);
    }

    async run(ctx: RoutedRequestContext): Promise<void> {
        const category = ctx.params.get("category") as FileCategory;
        const id = ctx.params.get("id");

        assert(category, "`category` param is not set");
        assert(id, "`id` param is not set");

        if (!fileCategories.has(category)) {
            await setError(ctx.res, "Invalid category", 400);
            return;
        }

        const file = await this.gcs.getExistingFile(category, id);
        const bodyRes = await ctx.res.flushHeaders(200);

        const fileStream = file.createReadStream();
        fileStream.pipe(bodyRes.body);

        await new Promise((yay, nay) => {
            fileStream.on("end", yay);
            fileStream.on("error", nay);
        });

        await bodyRes.flushBody();
    }
}

class GcsStoragePlugin implements StoragePlugin {
    readonly type = "storage";
    readonly id = "storage-plugin";

    readonly assetUrl: string;

    private readonly gcs: GcsHandler;

    constructor(config: GcsStoragePluginConfig) {
        this.gcs = new GcsHandler(config);
        this.assetUrl = urljoin(
            config.baseUrl ?? DEFAULT_BASE_URL,
            "[category]",
            "[id]"
        );
    }

    async read(category: FileCategory, id: string): Promise<Buffer> {
        const file = await this.gcs.getExistingFile(category, id);
        const [buffer] = await file.download();
        return buffer;
    }

    async write(category: FileCategory, content: Buffer): Promise<string> {
        const id = await hasha.async(content, {
            algorithm: "sha256",
            encoding: "hex"
        });

        const path = this.gcs.getFilePath(category, id);
        const file = this.gcs.bucket.file(path);
        await file.save(content);

        return id;
    }

    async hash(method: string, category: FileCategory, id: string) {
        const file = await this.gcs.getExistingFile(category, id);
        const stream = file.createReadStream();
        return await hasha.fromStream(stream, {algorithm: method});
    }
}

const pluginExport: PluginExport<GcsStoragePluginConfig, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["bucketName"],
        properties: {
            bucketName: {
                type: "string"
            },
            bucketBasePath: {
                type: "string",
                nullable: true
            },
            keyFilename: {
                type: "string",
                nullable: true
            },
            baseUrl: {
                type: "string",
                pattern: "^\\/",
                nullable: true
            }
        }
    },
    provides: {
        storage: {
            pkg: "storage-plugin"
        }
    },
    init(config) {
        return [new GcsStoragePlugin(config), new FileRouteHandler(config)];
    }
};

export default pluginExport;
