import {createContext, ReactElement, ReactNode, useContext} from "react";
import type {PageContext} from "./types";

const Context = createContext<PageContext>(undefined as unknown as PageContext);

export interface PageContextProviderProps {
    pageContext: PageContext;
    children: ReactNode;
}

export function PageContextProvider({pageContext, children}: PageContextProviderProps): ReactElement {
    return (
        <Context.Provider value={pageContext}>
            {children}
        </Context.Provider>
    )
}

export function usePageContext(): PageContext {
    return useContext(Context);
}
