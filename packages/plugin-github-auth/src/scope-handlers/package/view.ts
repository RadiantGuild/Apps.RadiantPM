import {SwitchedScopeHandler} from "@radiantpm/plugin-utils";
import {Parameters} from "../Parameters";

export function register(handler: SwitchedScopeHandler<Parameters>): void {
    // TODO

    handler.register("package.view", {
        async check() {
            return {success: true};
        },
        async listValid() {
            return {validObjects: null};
        }
    });
}
