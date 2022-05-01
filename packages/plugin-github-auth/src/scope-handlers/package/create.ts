import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import parseGithubUrl from "parse-github-url";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("package.create", {
        async check({type, slug, feedSlug, repository}, cfg, ctx) {
            try {
                // check if the user can push to a repo with the name from the slug
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
                        errorMessage:
                            "User does not have permission to push to the repository"
                    };
                }
            } catch (err) {
                // check if the user can push to a repo with the name from the repository field

                if (!repository) {
                    return {
                        success: false,
                        errorMessage:
                            "Package does not have a repository and its name does not match a GitHub repository"
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
                            errorMessage:
                                "User does not have permission to push to the repository"
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
