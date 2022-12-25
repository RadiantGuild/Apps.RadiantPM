import type AuthenticationPlugin from "./authentication/AuthenticationPlugin";
import {CachePlugin} from "./cache";
import {DatabasePlugin} from "./database";
import type {MiddlewarePlugin} from "./middleware";
import {PackageHandlerPlugin} from "./package-handler";
import type {StoragePlugin} from "./storage";
import {ValidationPlugin} from "./validation";

type Plugin =
    | AuthenticationPlugin
    | MiddlewarePlugin
    | StoragePlugin
    | DatabasePlugin
    | ValidationPlugin
    | PackageHandlerPlugin
    | CachePlugin;

export default Plugin;
