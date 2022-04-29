import SerialisablePluginBase from "../SerialisablePluginBase";

/**
 * @see AuthenticationPlugin
 */
export default interface SerialisableAuthenticationPlugin
    extends SerialisablePluginBase<"authentication"> {
    id: string;
    displayName: string;
    loginUrl: string;
    logoutUrl: string;
    loginChangedUrl?: string;
    hasValidAccessTokenUrl: string;
    checkUrl: string;
    isRequiredUrl?: string;
}
