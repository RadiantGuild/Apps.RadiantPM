import {ComponentType} from "react";

type PropsOf<T extends ComponentType> = T extends ComponentType<infer Props> ? Props : never;
export default PropsOf;
