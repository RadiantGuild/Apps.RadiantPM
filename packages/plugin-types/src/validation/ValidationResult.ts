export interface SuccessfulValidationResult {
    success: true;
}

export interface FailedValidationResult {
    success: false;
    errorMessage: string;
}

export type ValidationResult = SuccessfulValidationResult | FailedValidationResult;
