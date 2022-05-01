import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import parseGithubUrl from "parse-github-url";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("package.view", {
        async check({slug, feedSlug}, cfg, ctx) {
            try {
                // check if the user can see a repo with the name from the slug
                await ctx.gh.repos.get({
                    owner: feedSlug,
                    repo: slug
                });

                return {success: true};
            } catch {
                // check if the user can see the repository specified in the package info

                const feedId = await ctx.db.getFeedIdFromSlug(feedSlug);

                if (!feedId) {
                    return {
                        success: false,
                        errorMessage: "Feed does not exist"
                    };
                }

                const packageId = await ctx.db.getPackageIdFromSlug(
                    feedId,
                    slug
                );

                if (!packageId) {
                    return {
                        success: false,
                        errorMessage: "Package does not exist"
                    };
                }

                const {repository} = await ctx.db.getPackageFromId(packageId);
                if (!repository) {
                    return {
                        success: false,
                        errorMessage: "Source repository is not visible"
                    };
                }

                const githubUrl = parseGithubUrl(repository);

                if (!githubUrl || githubUrl.host !== "github.com") {
                    return {
                        success: false,
                        errorMessage: "Source repository is invalid"
                    };
                }

                if (githubUrl.owner?.toLowerCase() !== feedSlug) {
                    return {
                        success: false,
                        errorMessage:
                            "Source repository owner does not match the feed slug"
                    };
                }

                if (!githubUrl.name) {
                    return {
                        success: false,
                        errorMessage: "No source repository name provided"
                    };
                }

                try {
                    await ctx.gh.repos.get({
                        owner: feedSlug,
                        repo: githubUrl.name
                    });

                    return {
                        success: true
                    };
                } catch {
                    return {
                        success: false,
                        errorMessage:
                            "Package repository does not exist or you don't have permission to view it"
                    };
                }
            }
        },
        async listValid() {
            // TODO

            return {validObjects: null};
        }
    });
}
