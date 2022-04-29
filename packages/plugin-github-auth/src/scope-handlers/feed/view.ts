import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";
import hasStatus from "~/utils/hasStatus";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("feed.view", {
        async check(scope, config, ctx) {
            // check if the organisation is public or private—if there are any public repositories, count it as public,
            // otherwise count it as private, so you can only see it if you are a part of that org

            try {
                const ghOrg = await ctx.gh.orgs.get({org: scope.slug});

                if (ghOrg.data.public_repos > 0) {
                    return {
                        success: true
                    };
                } else if (ctx.authState.isLoggedIn) {
                    const isInOrg = await ctx.isInOrg(scope.slug);

                    if (isInOrg) {
                        return {
                            success: true
                        };
                    } else {
                        return {
                            success: false,
                            errorMessage: "No visible repos"
                        };
                    }
                }
            } catch (err) {
                if (!hasStatus(err) || err.status !== 404) {
                    throw err;
                }

                return {
                    success: false,
                    errorMessage: "Org does not exist"
                };
            }

            return {
                success: false,
                errorMessage: "Got too far"
            };
        },
        async listValid() {
            // TODO

            return {validObjects: null};
        }
    });
}
