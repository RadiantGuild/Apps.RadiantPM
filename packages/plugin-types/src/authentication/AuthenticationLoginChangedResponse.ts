export interface AuthenticationLoginChangedError {
    /**
     * The `name` of the field that has the error
     */
    field: string;

    /**
     * A user-facing error message that describes what is invalid
     */
    message: string;
}

export interface SuccessfulAuthenticationLoginChangedResponse {
    valid: true;
}

export interface FailedAuthenticationLoginChangedResponse {
    valid: false;
    errors: AuthenticationLoginChangedError[];
}

export type AuthenticationLoginChangedResponse = SuccessfulAuthenticationLoginChangedResponse | FailedAuthenticationLoginChangedResponse;
