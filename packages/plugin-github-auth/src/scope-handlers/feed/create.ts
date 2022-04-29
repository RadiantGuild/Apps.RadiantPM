import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("feed.create", {
        async check(scope, config, ctx) {
            if (!ctx.authState.isLoggedIn) {
                return {
                    success: false,
                    errorMessage: "Not logged in"
                };
            }

            if (!config.feedCreators.includes(ctx.authState.username)) {
                return {
                    success: false,
                    errorMessage: "Not a feed creator"
                };
            }

            const isInOrg = await ctx.isInOrg(scope.slug);

            if (!isInOrg) {
                return {
                    success: false,
                    errorMessage: "Not in org with slug from feed"
                };
            }

            return {
                success: true
            };
        },
        async listValid(kind, config, ctx) {
            if (!ctx.authState.isLoggedIn) {
                return {
                    validObjects: []
                };
            }

            if (!config.feedCreators.includes(ctx.authState.username)) {
                return {
                    validObjects: []
                };
            }

            const {data: userOrgs} =
                await ctx.gh.orgs.listForAuthenticatedUser();

            return {
                validObjects: userOrgs.map(org => org.login.toLowerCase())
            };
        }
    });
}
