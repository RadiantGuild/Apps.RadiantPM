import {useEffect, useState} from "react";
import {usePageContext} from "~/renderer/usePageContext";

const mediaQuery =
    typeof window === "undefined"
        ? null
        : window.matchMedia?.("(prefers-color-scheme: dark)");

export default function useColourModeValue<Light, Dark>(
    light: Light,
    dark: Dark
): Light | Dark {
    const pageContext = usePageContext();

    const [isDark, setIsDark] = useState(pageContext?.userPreferences?.colorMode !== "light");

    useEffect(() => {
        if (!mediaQuery) {
            // matchMedia might not be supported
            return;
        }

        // update the state only on the client-side
        setIsDark(mediaQuery.matches);
    }, [setIsDark]);

    useEffect(() => {
        if (!mediaQuery) {
            // matchMedia might not be supported
            return;
        }

        // listen for changes in the colour mode
        function handleChange(ev: MediaQueryListEvent) {
            setIsDark(ev.matches);
        }

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [setIsDark]);

    return isDark ? dark : light;
}
