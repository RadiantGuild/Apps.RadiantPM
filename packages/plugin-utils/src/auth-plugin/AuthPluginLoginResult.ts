export interface SuccessfulAuthPluginLoginResult {
    success: true;
    accessToken: string;
}

export interface FailedAuthLoginResult {
    success: false;
    errorMessage: string;
}

type AuthPluginLoginResult = SuccessfulAuthPluginLoginResult | FailedAuthLoginResult;
export default AuthPluginLoginResult;
