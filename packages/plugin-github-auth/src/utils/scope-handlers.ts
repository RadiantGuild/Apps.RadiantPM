import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {register} from "~/scope-handlers";
import {Parameters} from "~/scope-handlers/Parameters";

export const switchedScopeHandler = new SwitchedScopeHandler<Parameters>();
register(switchedScopeHandler);
