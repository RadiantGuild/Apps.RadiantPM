import {PageContextBuiltIn} from "vite-plugin-ssr";
import {CreatePageProps} from "./create.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";
import randomName from "~/utils/randomName";

export async function onBeforeRender(
    pageContext: PageContext & PageContextBuiltIn
): OnBeforeRenderResult<CreatePageProps> {
    const feedSlug = pageContext.routeParams.feedSlug;

    const name = randomName();

    return {
        pageContext: {
            pageProps: {
                feedSlug,
                randomName: name,
                randomSlug: name.replace(/ /g, "-").toLowerCase()
            }
        }
    };
}
