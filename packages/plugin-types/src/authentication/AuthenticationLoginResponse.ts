export interface SuccessfulAuthenticationLoginResponse {
    success: true;
}

export interface FailedAuthenticationLoginResponse {
    success: false;
    errorMessage: string;
}

export type AuthenticationLoginResponse = SuccessfulAuthenticationLoginResponse | FailedAuthenticationLoginResponse;
