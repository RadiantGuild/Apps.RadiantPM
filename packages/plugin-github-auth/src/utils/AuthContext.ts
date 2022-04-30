import {Octokit} from "@octokit/rest";
import {DatabasePlugin} from "@radiantpm/plugin-types";
import {AuthState} from "~/types/AuthState";

export default class AuthContext {
    constructor(
        readonly octokit: Octokit,
        readonly db: DatabasePlugin,
        readonly authState: AuthState
    ) {}

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
