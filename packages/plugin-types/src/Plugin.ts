import type AuthenticationPlugin from "./authentication/AuthenticationPlugin";
import {DatabasePlugin} from "./database";
import type {MiddlewarePlugin} from "./middleware";
import type {StoragePlugin} from "./storage";
import {ValidationPlugin} from "./validation";

type Plugin =
    | AuthenticationPlugin
    | MiddlewarePlugin
    | StoragePlugin
    | DatabasePlugin
    | ValidationPlugin;

export default Plugin;
