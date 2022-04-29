import {ReactElement, useCallback, useMemo} from "react";
import {Link} from "./Link";
import {useLoggedIn} from "~/hooks/useLoggedIn";
import {usePageContext} from "~/renderer/usePageContext";

export function NavAccount(): ReactElement | null {
    const {result: loggedIn} = useLoggedIn();
    const {
        urlPathname,
        clientPlugins: {authentication}
    } = usePageContext();

    const returnQuery = useMemo(() => {
        const query = new URLSearchParams();
        query.set("return", urlPathname);
        return query.toString();
    }, [urlPathname]);

    const handleLogOut = useCallback(() => {
        fetch(authentication.logoutUrl).then(() => location.reload());
    }, [authentication.logoutUrl]);

    if (loggedIn) {
        return (
            <Link href="#" onClick={handleLogOut}>
                Log out
            </Link>
        );
    } else if (loggedIn === false) {
        return <Link href={`/login?${returnQuery}`}>Log in</Link>;
    } else {
        return null;
    }
}
