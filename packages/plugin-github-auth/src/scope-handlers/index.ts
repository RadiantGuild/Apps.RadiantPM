import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "~/scope-handlers/Parameters";
import {register as registerFeed} from "~/scope-handlers/feed";
import {register as registerPackage} from "~/scope-handlers/package";
import {register as registerPage} from "~/scope-handlers/page";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    registerPage(handler);
    registerFeed(handler);
    registerPackage(handler);
}
