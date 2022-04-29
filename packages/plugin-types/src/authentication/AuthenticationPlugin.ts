import PluginBase from "../PluginBase";
import {HttpRequest} from "../middleware";
import {AuthenticationCheckResponse} from "./AuthenticationCheckResponse";
import AuthenticationField from "./AuthenticationField";
import {AuthenticationListValidResponse} from "./AuthenticationListValidResponse";
import Scope from "./Scope";

export default interface AuthenticationPlugin
    extends PluginBase<"authentication"> {
    /**
     * An identifier for this plugin, which is local to a `PluginExport`.
     */
    id: string;

    /**
     * A user-visible name that identifies the plugin
     */
    displayName: string;

    /**
     * A HEAD request is sent to this URL.
     * The request may or may not have an access token set.
     *
     * The endpoint's implementation should be equivalent to `!!getAccessToken() && checkAccessTokenValidity()`.
     *
     * If there is an access token, and it is valid, return a `201` status code.
     * Otherwise, return a `401` status code.
     * The response should not have any data.
     */
    hasValidAccessTokenUrl: string;

    /**
     * A POST request is sent to this url when the submission button is pressed.
     * The endpoint is passed JSON in the body, with key/value pairs from the `AuthenticationField`s that getFields() returns.
     * All values are strings.
     *
     * This endpoint must return a JSON object that conforms to the `AuthenticationLoginResponse` type.
     */
    loginUrl: string;

    /**
     * A POST request is sent to this url when the user wishes to log out.
     * The request handler must delete the access token from the user or invalidate it,
     * so that a request to `hasValidAccessTokenUrl` returns a 401.
     */
    logoutUrl: string;

    /**
     * A GET request is sent to this url whenever a value in the form changes.
     * The endpoint is passed the key/value pairs from the `AuthenticationField`s that getFields() returns,
     * as query parameters.
     * All the values are strings.
     *
     * This endpoint must return a JSON object that conforms to the `AuthenticationLoginChangedResponse` type.
     */
    loginChangedUrl?: string;

    /**
     * Checks if a user can do the action that the scope represents
     *
     * A GET request is sent to this URL, with one URL parameter,
     * `scope` - a base64url string with a value specified in the `Scope` type.
     *
     * This endpoint must return a JSON object that conforms to the `AuthenticationCheckResponse` type.
     */
    checkUrl: string;

    /**
     * Lists all the specific objects that a user has permission to perform the action that a scope represents
     *
     * A GET request is sent to this URL, with one URL parameter, `kind`, which is the type of scope that the check is against
     *
     * This endpoint must return a JSON object that conforms to the `AuthenticationListValidResponse` type.
     */
    listValidUrl: string;

    /**
     * A GET request is sent to this URL with a `scope` parameter,
     * which is a base64url string with a value specified in the `Scope` type.
     *
     * This endpoint must return a JSON object that conforms to the `AuthenticationRequiredResponse` type.
     *
     * If this is defined, `isRequired()` must be too.
     */
    isRequiredUrl?: string;

    /**
     * Allows special information to be added to the plugin to be used later
     */
    [context: symbol]: unknown;

    /**
     * The same as what the `checkUrl` endpoint does, but as a direct function call
     * @param accessToken The access token returned from `loginUrl`, or null if the user isn't logged in
     * @param scope A scope that describes what the user is attempting to do
     */
    check(
        accessToken: string | null,
        scope: Scope
    ): AuthenticationCheckResponse | Promise<AuthenticationCheckResponse>;

    /**
     * The same as what the `listValid` endpoint does, but as a direct function call
     * @param accessToken The access token returned from `loginUrl`, or null if the user isn't logged in
     * @param scopeKind The kind of scope to list the valid items
     */
    listValid(
        accessToken: string | null,
        scopeKind: Scope["kind"]
    ):
        | AuthenticationListValidResponse
        | Promise<AuthenticationListValidResponse>;

    /**
     * The same as what the `isRequiredUrl` endpoint does, but as a direct function call.
     * If this is defined, `isRequiredUrl` must be too.
     * @param scope A scope that describes what the user is attempting to do
     */
    isRequired?(scope: Scope): boolean | Promise<boolean>;

    /**
     * Returns a list of fields to ask the user about
     */
    getFields(): AuthenticationField[] | Promise<AuthenticationField[]>;

    /**
     * Returns the access token for a HTTP request, or null if there isn't one
     */
    getAccessToken(req: HttpRequest): string | null;

    /**
     * Checks if the supplied access token is valid.
     * This should be a quick and simple check - don't implement it if you can't check the validity synchronously.
     *
     * If you control the access token, it is recommended to use a JWT to make this check possible.
     */
    checkAccessTokenValidity?(accessToken: string): boolean;

    /**
     * Returns some text to show below the fields
     */
    getHelpText?(): string | Promise<string>;
}
