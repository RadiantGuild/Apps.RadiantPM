import assert from "assert";
import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("turborepo-cs:cache.view", {
        async check({feedSlug}, {accessToken, authPlugin, dbPlugin}) {
            // TODO: prevent access to private caches by figuring out what package it is for

            assert(feedSlug, "missing feedSlug in cache.view scope");

            const feedViewAuthResult = await authPlugin.check(accessToken, {
                kind: "feed.view",
                slug: feedSlug
            });

            if (!feedViewAuthResult.success) return feedViewAuthResult;

            const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);
            assert(feedId, "feed stopped existing");

            const packages = await dbPlugin.listPackagesFromFeed(feedId);

            for (const pkg of packages) {
                const packageUpdateAuthResult = await authPlugin.check(
                    accessToken,
                    {
                        kind: "package.view",
                        slug: pkg.slug,
                        feedSlug
                    }
                );

                if (packageUpdateAuthResult.success) {
                    return packageUpdateAuthResult;
                }
            }

            return {
                success: false,
                errorMessage: "Missing read access for at least one package"
            };
        },
        listValid() {
            return Promise.resolve({
                validObjects: null
            });
        }
    });
}
