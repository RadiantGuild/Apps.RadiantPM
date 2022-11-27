import assert from "assert";
import {CustomScope} from "@radiantpm/plugin-types";
import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register<CustomScope["kind"]>("turborepo-cs:cache.update", {
        async check({feedSlug, packageSlug}, {accessToken, authPlugin}) {
            assert(feedSlug, "missing feedSlug in cache.view scope");
            assert(packageSlug, "missing packageSlug in cache.view scope");

            const feedViewAuthResult = await authPlugin.check(accessToken, {
                kind: "feed.view",
                slug: feedSlug
            });

            if (!feedViewAuthResult.success) return feedViewAuthResult;

            const packageUpdateAuthResult = await authPlugin.check(
                accessToken,
                {
                    kind: "package.update",
                    slug: packageSlug,
                    feedSlug
                }
            );

            if (!packageUpdateAuthResult.success)
                return packageUpdateAuthResult;

            return {success: true};
        },
        listValid() {
            return Promise.resolve({
                validObjects: null
            });
        }
    });
}
