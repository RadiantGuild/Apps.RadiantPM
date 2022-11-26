import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";

export function register(handler: SwitchedScopeHandler): void {
    handler.register("turborepo-cs", {
        async check() {

        }
    })
}
