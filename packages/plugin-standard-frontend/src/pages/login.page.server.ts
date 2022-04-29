import {LoginPageProps} from "~/pages/login.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<LoginPageProps> {
    const authPlugin = pageContext.plugins.authentication;

    const displayName = authPlugin.displayName;
    const fields = await authPlugin.getFields();

    return {
        pageContext: {
            pageProps: {
                authDisplayName: displayName,
                fields
            }
        }
    };
}
