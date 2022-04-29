export interface SuccessfulResponse {
    status: 200 | 201 | 204;
    success: true;
}

export interface FailedResponse {
    status: number;
    success: false;
    errorMessage: string;
}

export type MaybeErrorResponse = SuccessfulResponse | FailedResponse;
