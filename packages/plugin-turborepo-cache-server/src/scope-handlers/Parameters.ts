import {AuthenticationPlugin} from "@radiantpm/plugin-types";

export interface AuthContext {
    accessToken: string | null;
    authPlugin: AuthenticationPlugin;
}

export type Parameters = [ctx: AuthContext];
