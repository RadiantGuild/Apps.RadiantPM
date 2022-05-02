import {HttpRequest} from "@radiantpm/plugin-types";

export async function getText(req: HttpRequest): Promise<string> {
    if (req.body.readableEnded) {
        throw new Error("Cannot read from body after it has ended");
    }

    const chunks: Buffer[] = [];
    req.body.on("data", data => chunks.push(data));

    await new Promise<void>((yay, nay) => {
        req.body.on("end", yay);
        req.body.on("error", nay);
    });

    return Buffer.concat(chunks).toString();
}

export async function getJson<T>(req: HttpRequest): Promise<T> {
    const text = await getText(req);
    return JSON.parse(text);
}
