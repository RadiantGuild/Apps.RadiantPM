import P from "pino";

export function createLogger(name) {
    return P({
        name,
        level: process.env.LOG_LEVEL
            ? process.env.LOG_LEVEL
            : process.env.NODE_ENV === "production"
                ? "warn"
                : "trace"
    });
}
