export interface SuccessfulAuthenticationCheckResponse {
    success: true;
}

export interface FailedAuthenticationCheckResponse {
    success: false;

    /**
     * A message that will be shown to the user
     */
    errorMessage: string;
}

export type AuthenticationCheckResponse = SuccessfulAuthenticationCheckResponse | FailedAuthenticationCheckResponse;
