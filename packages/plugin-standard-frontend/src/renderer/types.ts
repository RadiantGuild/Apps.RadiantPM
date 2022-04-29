import {
    AuthenticationPlugin,
    DatabasePlugin,
    FileCategory,
    HttpRequest,
    SerialisableAuthenticationPlugin,
    SerialisableStoragePlugin,
    SerialisableValidationPlugin,
    StoragePlugin, ValidationPlugin
} from "@radiantpm/plugin-types";
import {ReactElement} from "react";
import {FilledContext} from "react-helmet-async";
import type {navigate} from "vite-plugin-ssr/client/router";
import {Configuration} from "~/types/Configuration";

export type PageProps = Record<string, never>;

// The `pageContext` that are available in both on the server-side and browser-side
export type PageContext = {
    Page: (pageProps: PageProps) => ReactElement;
    pageProps: PageProps;
    urlPathname: string;
    helmetContext: FilledContext;

    navigate: typeof navigate;

    routeParams: Record<string, string>;

    /**
     * The request that triggered this render
     */
    httpRequest: HttpRequest;

    plugins: {
        authentication: AuthenticationPlugin;
        database: DatabasePlugin;
        storage: {
            [Key in FileCategory]: StoragePlugin;
        };
        validation: ValidationPlugin;
    };

    clientPlugins: {
        authentication: SerialisableAuthenticationPlugin;
        storage: {
            [Key in FileCategory]: SerialisableStoragePlugin;
        };
        validation: SerialisableValidationPlugin;
    };

    config: Pick<Configuration, "favicon" | "logo" | "logoText">;

    /**
     * If this value is set, the user will be redirected to the new location
     * using HTTP
     */
    redirect?: {
        /**
         * The URL to send the user to
         */
        target: string;

        /**
         * If the redirect is permanent, the status code will be 308 (Permanent Redirect).
         * Otherwise (and by default), it will be 307 (Temporary Redirect).
         */
        redirectIsPermanent?: boolean;
    };

    userPreferences?: {
        colorMode?: "light" | "dark" | "system";
    };
};

export type OnBeforeRenderResult<Props> = Promise<{
    pageContext: Partial<
        Omit<PageContext, "pageProps" | "redirect" | "navigate">
    > &
        (
            | {redirect: PageContext["redirect"]; pageProps?: undefined}
            | {redirect?: undefined; pageProps: Props}
        );
}>;
