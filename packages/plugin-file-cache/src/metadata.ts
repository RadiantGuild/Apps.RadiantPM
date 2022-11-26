import {readFile, writeFile} from "fs/promises";
import {CacheSetOptions} from "@radiantpm/plugin-types";

export interface CachedValueMetadata {
    expiryUnixTime: bigint;
}

function getUnixExpiryFromOptions(options: CacheSetOptions): bigint {
    const currentTimeMs = BigInt(Date.now());

    if (options.expireInSeconds) {
        const additionalTimeMs = BigInt(Math.floor(options.expireInSeconds * 1000));
        return currentTimeMs + additionalTimeMs;
    } else {
        return 0n;
    }
}

function writeExpiryTimestamp(buffer: Buffer, options: CacheSetOptions) {
    const timestamp = getUnixExpiryFromOptions(options);
    buffer.writeBigUInt64LE(timestamp);
}

function readExpiryTimestamp(buffer: Buffer) {
    return buffer.readBigUInt64LE();
}

export async function writeMetadata(basePath: string, options: CacheSetOptions): Promise<void> {
    const path = basePath + ".meta";

    const body = Buffer.alloc(8);
    writeExpiryTimestamp(body, options);

    await writeFile(path, body);
}

export async function readMetadata(basePath: string): Promise<CachedValueMetadata> {
    const path = basePath + ".meta";

    const body = await readFile(path);
    const expiryUnixTime = readExpiryTimestamp(body);

    return {
        expiryUnixTime
    };
}
