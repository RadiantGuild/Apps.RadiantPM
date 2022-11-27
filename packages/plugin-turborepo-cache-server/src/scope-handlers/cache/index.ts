import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";
import {register as registerView} from "./view";
import {register as registerUpdate} from "./update";

export function register(handler: SwitchedScopeHandler<Parameters>) {
    registerView(handler);
    registerUpdate(handler);
}
