import assert from "assert";
import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    handler.register("turborepo-cs:cache.view", {
        async check({feedSlug, packageSlug}, {accessToken, authPlugin}) {
            assert(feedSlug, "missing feedSlug in cache.view scope");
            assert(packageSlug, "missing packageSlug in cache.view scope");

            const feedViewAuthResult = await authPlugin.check(accessToken, {
                kind: "feed.view",
                slug: feedSlug
            });

            if (!feedViewAuthResult.success) return feedViewAuthResult;

            const packageViewAuthResult = await authPlugin.check(accessToken, {
                kind: "package.view",
                slug: packageSlug,
                feedSlug
            });

            if (!packageViewAuthResult.success) return packageViewAuthResult;

            return {success: true};
        },
        listValid() {
            return Promise.resolve({
                validObjects: null
            });
        }
    });
}
