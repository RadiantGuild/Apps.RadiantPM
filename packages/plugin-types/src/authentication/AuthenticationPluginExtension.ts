import {AuthenticationCheckResponse} from "./AuthenticationCheckResponse";
import {AuthenticationListValidResponse} from "./AuthenticationListValidResponse";
import Scope, {CustomScope} from "./Scope";

export interface ExtensionScope {
    /**
     * An identifier, unique to this extension, for this scope.
     * This value, namespaced with the extension identifier,
     * is used as the globally unique identifier for this scope.
     */
    id: string;

    /**
     * User-facing description of what the scope allows a user to do.
     * The description should use imperative verb form.
     * @example Query information about a package
     */
    description: string;
}

/**
 * A subset of the `AuthenticationPlugin` type, but allowing `Scope` to be any type.
 */
export default interface AuthenticationPluginExtension {
    /**
     * A list of scopes that this extension can handle.
     * If a scope is not defined here, it will be ignored.
     */
    scopes: ExtensionScope[];

    /**
     * Checks if a user can do the action that the scope represents.
     * Hint: base your authentication checks on the built-in scopes, using the main authentication plugin.
     *
     * @param accessToken An opaque and private token that identifies a user, or null if they aren't logged in.
     * @param scope A scope that describes what the user is attempting to do.
     * The `kind` field is one of the kinds from `scopes`, prefixed with the extension ID.
     */
    check(
        accessToken: string | null,
        scope: CustomScope
    ): Promise<AuthenticationCheckResponse>;

    /**
     * Lists all the specific objects that the user has permission to perform the action that the scope represents on.
     *
     * @param accessToken An opaque and private token that identifies a user, or null if they aren't logged in.
     * @param scopeKind A scope identifier that describes what the user is attempting to do.
     * One of the kinds from `scopes`, not including the namespace.
     */
    listValid(
        accessToken: string | null,
        scopeKind: CustomScope["kind"]
    ): Promise<AuthenticationListValidResponse>;
}
