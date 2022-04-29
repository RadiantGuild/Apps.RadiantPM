import assert from "assert";
import {AuthenticationPlugin, DatabasePlugin} from "@radiantpm/plugin-types";

let databasePlugin: DatabasePlugin | undefined;
let authenticationPlugin: AuthenticationPlugin | undefined;

export function setDatabasePlugin(plugin: DatabasePlugin): void {
    databasePlugin = plugin;
}

export function setAuthenticationPlugin(plugin: AuthenticationPlugin): void {
    authenticationPlugin = plugin;
}

export function getDatabasePlugin(): DatabasePlugin {
    assert(databasePlugin, "Database plugin is not defined");
    return databasePlugin;
}

export function getAuthenticationPlugin(): AuthenticationPlugin {
    assert(authenticationPlugin, "Authentication plugin is not defined");
    return authenticationPlugin;
}
