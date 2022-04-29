export default function hasStatus(obj: unknown): obj is {status: number} {
    if (!obj) return false;
    return typeof (obj as {status: unknown}).status === "number";
}
