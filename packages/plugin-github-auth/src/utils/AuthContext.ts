import {Octokit} from "@octokit/rest";
import {DatabasePlugin, PackageHandlerPlugin} from "@radiantpm/plugin-types";
import {AuthState} from "~/types/AuthState";

export interface AuthContextInit {
    octokit: Octokit;
    authState: AuthState;
    dbPlugin: DatabasePlugin;
    packageHandlers: PackageHandlerPlugin[];
}

export default class AuthContext {
    readonly octokit: Octokit;
    readonly authState: AuthState;
    readonly db: DatabasePlugin;

    private readonly packageHandlers: ReadonlyMap<string, PackageHandlerPlugin>;

    constructor(init: AuthContextInit) {
        this.octokit = init.octokit;
        this.authState = init.authState;
        this.db = init.dbPlugin;

        this.packageHandlers = new Map(
            init.packageHandlers.map(handler => [handler.packageType, handler])
        );
    }

    getPackageHandler(type: string): PackageHandlerPlugin {
        const handler = this.packageHandlers.get(type);
        if (!handler) throw new Error(`No package handler is registered for ${type} packages`);
        return handler;
    }

    get gh(): Octokit["rest"] {
        return this.octokit.rest;
    }

    async isInOrg(org: string): Promise<boolean> {
        if (!this.authState.isLoggedIn) return false;

        const res = await this.octokit.rest.orgs
            .checkMembershipForUser({
                org,
                username: this.authState.username
            })
            .catch(() => ({status: 404}));

        return (res.status as number) === 204;
    }
}
