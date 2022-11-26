import {ConfirmPageProps} from "~/pages/login/confirm.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<ConfirmPageProps> {
    const authPlugin = pageContext.plugins.authentication;

    const queryParams = pageContext.httpRequest.url.searchParams;
    const app = queryParams.get("app");
    const returnUrl = queryParams.get("return");

    const accessToken = authPlugin.getAccessToken(pageContext.httpRequest);
    const isAccessTokenValid =
        accessToken &&
        (authPlugin.checkAccessTokenValidity?.(accessToken) ?? true);

    if (!returnUrl) {
        return {
            pageContext: {
                redirect: {
                    target: "/"
                }
            }
        };
    }

    if (!app || !isAccessTokenValid) {
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
                ssoDisplayName: app,
                returnUrl
            }
        }
    };
}
