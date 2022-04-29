interface ValidatorBase<Kind extends string> {
    kind: Kind;
}

/**
 * The source must not be shorter than the specified length
 */
export interface MinimumLengthValidator extends ValidatorBase<"len_min"> {
    minimumLength: number;
}

/**
 * The source must not be longer than the specified length
 */
export interface MaximumLengthValidator extends ValidatorBase<"len_max"> {
    maximumLength: number;
}

/**
 * The source must not start or end with whitespace
 */
export type TrimmedValidator = ValidatorBase<"trimmed">;

/**
 * The source must be a valid URL path segment, i.e. letters, numbers, `-` and `_`
 */
export type UrlValidator = ValidatorBase<"url">;

/**
 * Sends a POST request to middleware to perform server-only validation on the client. This validation method is only
 * available on the client, and may not work on the server.
 *
 * The client must pass the value as the request body in plain text.
 * The middleware must return a 201 status code if the validation was successful, or a 4xx status code if it wasn't.
 *
 * The validation middleware must perform validation using the same validators as returned from `getValidators`,
 * although it can also do extra custom validation.
 * You can use the `getYoogiValidators` or `validate` functions from `@radiantpm/plugin-utils` to perform the validation.
 */
export interface RequestValidator extends ValidatorBase<"req"> {
    /**
     * The URL path to send the request to
     */
    path: string;

    /**
     * The message to display if the validator fails
     */
    message: string;
}

export type Validator =
    | MinimumLengthValidator
    | MaximumLengthValidator
    | TrimmedValidator
    | UrlValidator
    | RequestValidator;
