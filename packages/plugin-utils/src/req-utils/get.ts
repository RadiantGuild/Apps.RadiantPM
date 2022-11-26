import {HttpRequest} from "@radiantpm/plugin-types";

export async function getBuffer(req: HttpRequest): Promise<Buffer> {
    if (req.body.readableEnded) {
        throw new Error("Cannot read from body after it has ended");
    }

    const chunks: Buffer[] = [];
    req.body.on("data", data => chunks.push(data));

    await new Promise<void>((yay, nay) => {
        req.body.on("end", yay);
        req.body.on("error", nay);
    });

    return Buffer.concat(chunks);
}

export async function getText(req: HttpRequest): Promise<string> {
    const buffer = await getBuffer(req);
    return buffer.toString();
}

export async function getJson<T>(req: HttpRequest): Promise<T> {
    const text = await getText(req);
    return JSON.parse(text);
}
