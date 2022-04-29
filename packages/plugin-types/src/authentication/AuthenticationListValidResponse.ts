/**
 * Either the user has permission to perform this action on any object,
 * or the objects that the user can perform the action on are unknown or cannot be listed
 */
interface AuthenticationListValidResponse_AnyOrUnknown {
    validObjects: null;
}

/**
 * The user does not have permission to perform this action
 */
interface AuthenticationListValidResponse_NotAllowed {
    errorMessage?: string;
    validObjects: [];
}

/**
 * The user has permission to perform this action on the objects listed.
 * There may be false positives, but there must not be any false negatives,
 * as the option to use a different value will not be presented to the user.
 */
interface AuthenticationListValidResponse_Known {
    errorMessage?: null;
    validObjects: string[];
}

export type AuthenticationListValidResponse =
    | AuthenticationListValidResponse_NotAllowed
    | AuthenticationListValidResponse_AnyOrUnknown
    | AuthenticationListValidResponse_Known;

export function isListValidResponseNotAllowed(response: AuthenticationListValidResponse): response is AuthenticationListValidResponse_NotAllowed {
    return Array.isArray(response.validObjects) && response.validObjects.length === 0;
}
