import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";
import {register as registerCreate} from "./create";
import {register as registerView} from "./view";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    registerView(handler);
    registerCreate(handler);
}
