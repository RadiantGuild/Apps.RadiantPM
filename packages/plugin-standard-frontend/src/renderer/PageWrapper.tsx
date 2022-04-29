import "modern-normalize";
import "@fontsource/inter/variable.css";
import "./global.css";

import {fillUrl} from "@radiantpm/bfutils";
import {AssetUrlParams} from "@radiantpm/plugin-types";
import {ReactElement, ReactNode, StrictMode, useMemo} from "react";
import {Helmet, HelmetProvider} from "react-helmet-async";
import {useWindowScroll} from "react-use";
import {NavAccount} from "~/components/NavAccount";
import useColourModeValue from "~/hooks/useColourModeValue";
import {
    PageContextProvider,
    PageContextProviderProps,
    usePageContext
} from "~/renderer/usePageContext";
import {styled,globalCss} from "~/stitches.config";
import darkTheme from "~/themes/dark";
import lightTheme from "~/themes/light";

const globalStyles = globalCss({
    "::selection": {
        background: "$selectionBackground",
        color: "currentColor"
    }
})

const Layout = styled("div", {
    minHeight: "100vh",
    background: "$background"
});

const NavigationContainer = styled("div", {
    background: "$backgroundAlpha",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    backdropFilter: "blur(8px)",
    borderBottom: "1px solid",
    borderBottomColor: "transparent",
    transition: "border-bottom-color 150ms",
    variants: {
        scrolled: {
            true: {
                borderBottomColor: "$border"
            }
        }
    }
});

const Navigation = styled("nav", {
    display: "flex",
    alignItems: "center",
    paddingX: "$3",
    height: "4rem",
    maxWidth: "1200px",
    width: "100%",
    marginX: "auto"
});

const NavigationSpacer = styled("div", {
    flexGrow: 1
});

const LogoLink = styled("a", {
    height: "50%",
    userSelect: "none"
});

const Logo = styled("img", {
    height: "100%"
});

const MainContainer = styled("div", {
    paddingTop: "4rem",
    minHeight: "100%",
    maxWidth: "1200px",
    width: "100%",
    marginX: "auto"
});

const Main = styled("main", {
    padding: "1rem"
});

interface PageLayoutProps {
    children: ReactNode;
}

function PageLayout({children}: PageLayoutProps): ReactElement {
    const {
        config,
        clientPlugins: {
            storage: {static: staticStorage}
        }
    } = usePageContext();
    const theme = useColourModeValue(lightTheme, darkTheme);

    const faviconName = useColourModeValue(
        config.favicon.light,
        config.favicon.dark
    );

    const favicon = useMemo(
        () =>
            fillUrl<AssetUrlParams>(staticStorage.assetUrl, {
                id: faviconName,
                category: "static"
            }),
        [staticStorage, faviconName]
    );

    const logoTextName = useColourModeValue(
        config.logoText.light,
        config.logoText.dark
    );

    const logoText = useMemo(
        () =>
            fillUrl<AssetUrlParams>(staticStorage.assetUrl, {
                id: logoTextName,
                category: "static"
            }),
        [staticStorage, logoTextName]
    );

    const {y: scroll} = useWindowScroll();

    globalStyles();

    return (
        <Layout className={`style-root ${theme}`}>
            <Helmet>
                <link rel="icon" href={favicon} />
            </Helmet>
            <NavigationContainer scrolled={scroll > 0}>
                <Navigation>
                    <LogoLink href="/">
                        <Logo alt="Logo" src={logoText} />
                    </LogoLink>
                    <NavigationSpacer />
                    <NavAccount />
                </Navigation>
            </NavigationContainer>
            <MainContainer>
                <Main>{children}</Main>
            </MainContainer>
        </Layout>
    );
}

export function PageWrapper({
    children,
    pageContext
}: PageContextProviderProps): ReactElement {
    const helmetContext =
        typeof window === "undefined" ? pageContext.helmetContext : undefined;

    return (
        <StrictMode>
            <HelmetProvider context={helmetContext}>
                <PageContextProvider pageContext={pageContext}>
                    <PageLayout>{children}</PageLayout>
                </PageContextProvider>
            </HelmetProvider>
        </StrictMode>
    );
}
