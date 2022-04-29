import {Root} from "react-dom";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {createRoot, hydrateRoot} from "react-dom/client";
import {PageContextBuiltInClient} from "vite-plugin-ssr/client";
import {navigate, useClientRouter} from "vite-plugin-ssr/client/router";
import {PageWrapper} from "~/renderer/PageWrapper";
import {PageContext} from "~/renderer/types";

declare global {
    interface Console {
        assert(
            value: unknown,
            message?: string,
            ...optionalParams: unknown[]
        ): asserts value;
    }
}

let root: Root;

useClientRouter({
    render(pageContext: PageContextBuiltInClient & PageContext) {
        const {Page, pageProps} = pageContext;

        const pageContextWithNavigate: PageContext = {
            ...pageContext,
            navigate
        };

        const page = (
            <PageWrapper pageContext={pageContextWithNavigate}>
                <Page {...pageProps} />
            </PageWrapper>
        );

        const container = document.getElementById("page-view");
        console.assert(container, "Missing React container");

        if (pageContext.isHydration) {
            root = hydrateRoot(container, page);
        } else {
            root ??= createRoot(container);
            root.render(page);
        }
    }
});
