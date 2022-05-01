import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import parseGithubUrl from "parse-github-url";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("package.create", {
        async check({slug, feedSlug}, cfg, ctx) {
            try {
                // check if the user can see a repo with the name from the slug
                const repo = await ctx.gh.repos.get({
                    owner: feedSlug,
                    repo: slug
                });

                if (repo.data.permissions?.push) {
                    return {
                        success: true
                    };
                } else {
                    return {
                        success: false,
                        errorMessage: "User does not have permission to push to the repository"
                    };
                }
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

                if (githubUrl.owner !== feedSlug) {
                    return {
                        success: false,
                        errorMessage:
                            "Source repository owner does not match the feed slug"
                    };
                }

                if (!githubUrl.repo) {
                    return {
                        success: false,
                        errorMessage: "No source repository name provided"
                    };
                }

                try {
                    const repo = await ctx.gh.repos.get({
                        owner: feedSlug,
                        repo: githubUrl.repo
                    });

                    if (repo.data.permissions?.push) {
                        return {
                            success: true
                        };
                    } else {
                        return {
                            success: false,
                            errorMessage: "User does not have permission to push to the repository"
                        };
                    }
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
