import {ConfirmPageProps} from "~/pages/login/success.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<ConfirmPageProps> {
    const queryParams = pageContext.httpRequest.url.searchParams;
    const app = queryParams.get("app");

    if (!app) {
        return {
            pageContext: {
                redirect: {
                    target: "/login"
                }
            }
        };
    }

    return {
        pageContext: {
            pageProps: {
                ssoDisplayName: app
            }
        }
    };
}
