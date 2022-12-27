import assert from "assert";
import {CustomScope} from "@radiantpm/plugin-types";
import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register<CustomScope["kind"]>("turborepo-cs:cache.update", {
        async check({feedSlug}, {accessToken, authPlugin, dbPlugin}) {
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
                        kind: "package.update",
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
                errorMessage: "Missing update access for at least one package"
            };
        },
        listValid() {
            return Promise.resolve({
                validObjects: null
            });
        }
    });
}
