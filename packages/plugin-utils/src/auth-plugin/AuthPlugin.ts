import {
    AuthenticationCheckResponse,
    AuthenticationField,
    AuthenticationListValidResponse,
    AuthenticationLoginChangedResponse,
    BasicUserInfo,
    Scope
} from "@radiantpm/plugin-types";
import {SetCookieOptions} from "../req-utils";
import AuthPluginLoginResult from "./AuthPluginLoginResult";

export default interface AuthPlugin {
    /**
     * A unique identifier of this plugin. Must be URL safe, recommended using a lowercase dash-separated id.
     * This will be used as the ID of the resulting authentication plugin, to be put in the provisions.
     */
    id: string;

    /**
     * A user-visible name that identifies the plugin
     */
    displayName: string;

    /**
     * The name of the access token cookie
     */
    accessTokenCookieName: string;

    /**
     * Any configuration for the access token cookie
     */
    accessTokenCookieOptions?: SetCookieOptions;

    /**
     * Should be a quick and synchronous check to see if the access token is valid
     * (e.g. checking that a JWT has not expired yet).
     * If your access tokens do not support this, you don't need to implement this method.
     */
    checkAccessTokenValidity?(accessToken: string): boolean;

    /**
     * Handles the user pressing the login button.
     * @param fields The values for each field returned by `getFields()`
     * @param signal An AbortSignal that is triggered when the client hangs up
     * @remarks `fields` has not been checked to contain the correct values, you must do this yourself
     */
    onLogin(
        fields: Record<string, string>,
        signal: AbortSignal
    ): AuthPluginLoginResult | Promise<AuthPluginLoginResult>;

    /**
     * Called when a value in the login form has changed
     * @param fields The values for each field that was returned by `getFields()`
     * @param signal An AbortSignal that is triggered when the client hangs up
     * @remarks `fields` has not been checked to contain the correct values, you must do this yourself
     */
    onLoginChanged(
        fields: Record<string, string>,
        signal: AbortSignal
    ):
        | AuthenticationLoginChangedResponse
        | Promise<AuthenticationLoginChangedResponse>;

    /**
     * Checks if a user with the specified access token has permission to do the action specified by `scope`
     * @param accessToken The access token of the current user, or null if the user is not logged in
     * @param scope The action that the user is attempting
     * If this value is not recognised, return an unsuccessful result for the best security.
     */
    check(
        accessToken: string | null,
        scope: Scope
    ): AuthenticationCheckResponse | Promise<AuthenticationCheckResponse>;

    /**
     * Lists all the specific objects that a user has permission to perform the action that a scope represents
     * @param accessToken The access token of the current user, or null if the user is not logged in
     * @param scopeKind The kind of action to list valid objects for
     */
    listValid(
        accessToken: string | null,
        scopeKind: Scope["kind"]
    ):
        | AuthenticationListValidResponse
        | Promise<AuthenticationListValidResponse>;

    /**
     * Checks if authentication is required for the user to perform the action
     * associated with the scope
     * @param scope The action that the user is attempting.
     * If this value is not recognised, return `true` for the best security.
     */
    isRequired?(scope: Scope): boolean | Promise<boolean>;

    /**
     * Loads basic information about a user, such as their name and email.
     */
    getBasicUserInfo(accessToken: string): Promise<BasicUserInfo>;

    /**
     * Get a list of fields to use to log the user in
     */
    getFields(): AuthenticationField[] | Promise<AuthenticationField[]>;

    /**
     * Get some text to show below the login fields
     */
    getHelpText?(): string | Promise<string>;
}
