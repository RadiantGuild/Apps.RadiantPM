import {useLocalId} from "@radiantguild/form-contexts";
import {ReactElement, ReactNode} from "react";

export interface LinkedLabelProps {
    children: ReactNode;
    className?: string;
}

export function LinkedLabel({children, className}: LinkedLabelProps): ReactElement {
    const id = useLocalId();

    return <label htmlFor={id} className={className}>{children}</label>;
}
