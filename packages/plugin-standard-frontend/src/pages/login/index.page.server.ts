import {LoginPageProps} from "~/pages/login.page";
import {OnBeforeRenderResult, PageContext} from "~/renderer/types";

export async function onBeforeRender(
    pageContext: PageContext
): OnBeforeRenderResult<LoginPageProps> {
    const authPlugin = pageContext.plugins.authentication;

    const accessToken = await authPlugin.getAccessToken(
        pageContext.httpRequest
    );

    const queryParams = pageContext.httpRequest.url.searchParams;

    if (
        accessToken &&
        (authPlugin.checkAccessTokenValidity?.(accessToken) ?? true)
    ) {
        if (queryParams.has("app")) {
            const searchParams = new URLSearchParams({
                app: queryParams.get("app") || "",
                return: queryParams.get("return") || ""
            });

            return {
                pageContext: {
                    redirect: {
                        target: "/login/confirm?" + searchParams
                    }
                }
            };
        } else {
            return {
                pageContext: {
                    redirect: {
                        redirectIsPermanent: false,
                        target: queryParams.get("return") ?? "/"
                    }
                }
            };
        }
    }

    const displayName = authPlugin.displayName;
    const fields = await authPlugin.getFields();

    return {
        pageContext: {
            pageProps: {
                authDisplayName: displayName,
                ssoDisplayName: queryParams.get("app") ?? undefined,
                fields
            }
        }
    };
}
