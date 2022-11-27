import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "./Parameters";
import {register} from "./cache";

export const switchedScopeHandler = new SwitchedScopeHandler<Parameters>();
register(switchedScopeHandler);
