import {AuthenticationPlugin, DatabasePlugin} from "@radiantpm/plugin-types";

export interface AuthContext {
    accessToken: string | null;
    authPlugin: AuthenticationPlugin;
    dbPlugin: DatabasePlugin;
}

export type Parameters = [ctx: AuthContext];
