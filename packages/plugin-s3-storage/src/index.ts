import assert from "assert";
import {join} from "path";
import {Readable} from "stream";
import {
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client
} from "@aws-sdk/client-s3";
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

interface S3Credentials {
    accessKeyId: string;
    secretAccessKey: string;
}

interface Configuration {
    /**
     * The URL that the S3 API is at
     */
    s3Endpoint: string;

    /**
     * The name of the region to connect to
     */
    s3Region?: string;

    s3Credentials?: S3Credentials;

    /**
     * The name of the bucket to put the files.
     */
    bucketName: string;

    /**
     * The base directory of any uploaded objects.
     * @default Root
     */
    bucketBasePath?: string;

    /**
     * The base URL for requests. Must start with /. Defaults to `/-/storage/`.
     */
    baseUrl?: `/${string}`;
}

const DEFAULT_BASE_URL = "/-/storage/";

class S3Handler {
    private readonly client: S3Client;

    constructor(private readonly config: Configuration) {
        this.client = new S3Client({
            forcePathStyle: false,
            endpoint: config.s3Endpoint,
            region: config.s3Region,
            credentials: config.s3Credentials
        });
    }

    getFilePath(category: string, id: string) {
        id = id.replace(/[/.-]+/gi, "-");

        const {bucketBasePath} = this.config;
        if (!bucketBasePath) return join(category, id);
        return join(bucketBasePath, category, id);
    }

    async getExistingFile(category: FileCategory, id: string) {
        const path = this.getFilePath(category, id);

        const headCommand = new HeadObjectCommand({
            Bucket: this.config.bucketName,
            Key: path
        });

        const response = await this.client.send(headCommand);

        if (response.$metadata.httpStatusCode !== 200) {
            throw new HttpError(404, `${category} asset does not exist`);
        }

        const command = new GetObjectCommand({
            Bucket: this.config.bucketName,
            Key: path
        });

        const file = await this.client.send(command);

        if (!file.Body) {
            throw new HttpError(404, `${category} asset does not exist`);
        }

        return file.Body;
    }

    async createFile(category: FileCategory, id: string, content: Buffer) {
        const path = this.getFilePath(category, id);

        const command = new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: path,
            Body: content
        });

        await this.client.send(command);
    }
}

class FileRouteHandler extends RouteMiddlewarePlugin {
    private readonly s3: S3Handler;

    constructor(config: Configuration) {
        const url = urljoin(
            config.baseUrl ?? DEFAULT_BASE_URL,
            "[category]",
            "[id]"
        ) as `/${string}`;

        super(`GET ${url}`);
        this.s3 = new S3Handler(config);
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

        const file = await this.s3.getExistingFile(category, id);
        const bodyRes = await ctx.res.flushHeaders(200);

        const fileWebStream = file.transformToWebStream();
        const fileStream = Readable.fromWeb(fileWebStream as never);

        await fileStream.pipe(bodyRes.body);

        await new Promise((yay, nay) => {
            fileStream.on("end", yay);
            fileStream.on("error", nay);
        });

        await bodyRes.flushBody();
    }
}

class S3StoragePlugin implements StoragePlugin {
    readonly type = "storage";
    readonly id = "storage-plugin";

    readonly assetUrl: string;

    private readonly s3: S3Handler;

    constructor(config: Configuration) {
        this.s3 = new S3Handler(config);
        this.assetUrl = urljoin(
            config.baseUrl ?? DEFAULT_BASE_URL,
            "[category]",
            "[id]"
        );
    }

    async read(category: FileCategory, id: string): Promise<Buffer> {
        const file = await this.s3.getExistingFile(category, id);
        const rawBuffer = await file.transformToByteArray();
        return Buffer.from(rawBuffer);
    }

    async write(category: FileCategory, content: Buffer): Promise<string> {
        const id = await hasha.async(content, {
            algorithm: "sha256",
            encoding: "hex"
        });

        await this.s3.createFile(category, id, content);

        return id;
    }

    async hash(method: string, category: FileCategory, id: string) {
        const file = await this.s3.getExistingFile(category, id);
        const webStream = file.transformToWebStream();
        const stream = Readable.fromWeb(webStream as never);
        return await hasha.fromStream(stream, {algorithm: method});
    }
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["s3Endpoint", "bucketName"],
        properties: {
            bucketName: {
                type: "string"
            },
            bucketBasePath: {
                type: "string",
                nullable: true
            },
            baseUrl: {
                type: "string",
                nullable: true
            },
            s3Credentials: {
                type: "object",
                nullable: true,
                required: ["accessKeyId", "secretAccessKey"],
                properties: {
                    accessKeyId: {
                        type: "string"
                    },
                    secretAccessKey: {
                        type: "string"
                    }
                }
            },
            s3Endpoint: {
                type: "string"
            },
            s3Region: {
                type: "string",
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
        return [new S3StoragePlugin(config), new FileRouteHandler(config)];
    }
};

export default pluginExport;
