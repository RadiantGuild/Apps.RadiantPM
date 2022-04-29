import {renderToString} from "react-dom/server";
import {FilledContext} from "react-helmet-async";
import {dangerouslySkipEscape, escapeInject, PageContextBuiltIn} from "vite-plugin-ssr";
import {PageWrapper} from "~/renderer/PageWrapper";
import {PageContext} from "~/renderer/types";
import {getCssText} from "~/stitches.config";

// keys of the page context that will be sent to the client
export const passToClient: readonly (keyof PageContext)[] = ["pageProps", "userPreferences", "config", "clientPlugins"] as const;

export async function render(pageContext: PageContextBuiltIn & PageContext) {
    const {Page, pageProps} = pageContext;
    pageContext.helmetContext = {} as FilledContext;

    const pageHtml = renderToString(
        <PageWrapper pageContext={pageContext}>
            <Page {...pageProps} />
        </PageWrapper>
    );

    const {helmetContext: {helmet}} = pageContext;

    const documentHtml = escapeInject`<!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8" />
            ${dangerouslySkipEscape(helmet.title.toString())}
            ${dangerouslySkipEscape(helmet.meta.toString())}
            ${dangerouslySkipEscape(helmet.link.toString())}
            ${dangerouslySkipEscape(helmet.script.toString())}
            ${dangerouslySkipEscape(helmet.noscript.toString())}
            ${dangerouslySkipEscape(helmet.style.toString())}
            <style id="stitches">${dangerouslySkipEscape(getCssText())}</style>
        </head>
        <body>
            <div id="page-view">${dangerouslySkipEscape(pageHtml)}</div>
        </body>
    </html>`;

    return {
        documentHtml,
        pageContext: {}
    };
}
