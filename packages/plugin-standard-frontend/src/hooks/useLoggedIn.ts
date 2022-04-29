import {useAsync, UseAsyncReturn} from "react-async-hook";
import {usePageContext} from "~/renderer/usePageContext";

function check(url: string) {
    return fetch(url, {method: "HEAD"}).then(res => res.status === 204);
}

export function useLoggedIn(): UseAsyncReturn<boolean, [string]> {
    const pageContext = usePageContext();
    const {authentication} = pageContext.clientPlugins;
    const url = authentication.hasValidAccessTokenUrl;

    return useAsync(check, [url]);
}
