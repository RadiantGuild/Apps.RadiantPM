import {isListValidResponseNotAllowed} from "@radiantpm/plugin-types";
import {filter} from "async";
import {IndexPageProps} from "~/pages/index.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<IndexPageProps> {
    const dbPlugin = pageContext.plugins.database;
    const authPlugin = pageContext.plugins.authentication;

    if (
        await authPlugin.isRequired?.({
            kind: "page.view",
            page: "homepage"
        })
    ) {
        return {
            pageContext: {
                redirect: {
                    redirectIsPermanent: false,
                    target: "/login"
                }
            }
        };
    }

    const accessToken = await authPlugin.getAccessToken(
        pageContext.httpRequest
    );

    const feeds = await dbPlugin.listFeeds();

    const visibleFeeds = await filter(feeds, async ({slug}) => {
        const {success} = await authPlugin.check(accessToken, {
            kind: "feed.view",
            slug
        });

        return success;
    });

    const canAddFeeds = !isListValidResponseNotAllowed(
        await authPlugin.listValid(accessToken, "feed.create")
    );

    return {
        pageContext: {
            pageProps: {
                feeds: visibleFeeds,
                canAddFeeds
            }
        }
    };
}
