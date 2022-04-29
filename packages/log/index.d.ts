import P from "pino";

export type RpmLogger = P.Logger;

export declare function createLogger(name: string): RpmLogger;
