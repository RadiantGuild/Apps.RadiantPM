import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {isListValidResponseNotAllowed} from "@radiantpm/plugin-types";
import {PageContextBuiltIn} from "vite-plugin-ssr";
import {CreatePageProps} from "~/pages/feeds/create.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";
import randomName from "~/utils/randomName";

export async function onBeforeRender(
    pageContext: PageContext & PageContextBuiltIn
): OnBeforeRenderResult<CreatePageProps> {
    const {authentication, database} = pageContext.plugins;

    const accessToken = authentication.getAccessToken(pageContext.httpRequest);

    const listValidResult = await authentication.listValid(
        accessToken,
        "feed.create"
    );

    if (isListValidResponseNotAllowed(listValidResult)) {
        throw new HttpError(403, listValidResult.errorMessage);
    }

    const {validObjects: allFeedOptions} = listValidResult;

    const slugOptions = await Promise.all(
        allFeedOptions?.map(async feed => {
            return [feed, await database.getFeedIdFromSlug(feed)] as const;
        }) ?? []
    ).then(res => res.filter(([, has]) => !has).map(([slug]) => slug));

    return {
        pageContext: {
            pageProps: {
                randomName: randomName(),
                slugOptions
            }
        }
    };
}
