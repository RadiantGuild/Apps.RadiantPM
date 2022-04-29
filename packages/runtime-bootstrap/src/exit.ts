// Cannot be a symbol as multiple copies of this code may be used
const exitErrorCodeKey = "(exit error code)";

interface ExitError extends Error {
    [exitErrorCodeKey]: number;
}

/**
 * Checks if an error is the error used to exit out of the application.
 * If this method returns true, you must let the error propagate.
 *
 * @see exit
 */
export function isExitError(err: unknown): err is ExitError {
    if (!err) return false;

    return exitErrorCodeKey in (err as never);
}

export function getExitErrorCode(err: ExitError): number {
    return err[exitErrorCodeKey];
}

function exitImpl(code = 1, _isInner = false): never {
    const message = `${
        _isInner
            ? "The error used to exit the application was caught."
            : "EXIT ERROR. DO NOT CATCH."
    } (code=${code})
See runtime-bootstrap's \`Context.exit()\` documentation for more info.`;

    const error = new Error(message);

    // If the error is logged, the logger will enumerate the properties and try to read this variable.
    // The error being logged probably means it has been caught and won't be re-thrown.
    Object.defineProperty(error, "#exit_error_check#", {
        get() {
            console.error(
                "The error used to exit the application was caught.",
                "This error must be left to propagate up,",
                "see runtime-bootstrap's `Context.exit()` documentation for more info."
            );

            exitImpl(code, true);
        },
        enumerable: true
    });

    Object.defineProperty(error, exitErrorCodeKey, {
        value: code
    });

    throw error;
}

/**
 * ## Description
 *
 * Exits the bootstrapper, back into the init script.
 * The exit code will be returned to the init script, where it can do as it pleases.
 *
 * You may call this method at any time, not just for errors
 * (although most of the time an early exit will be because of an error).
 *
 * ## Namespaces
 *
 * To make sure there are not any collisions of error codes, there are some namespaces that have been defined.
 *
 * - `⠀⠀⠀⠀⠀0`: No error
 * - `⠀⠀⠀⠀⠀1`: Generic error
 * - `⠀⠀⠀⠀-1`: Uncaught error
 * - `⠀⠀1xxx`: **RESERVED**: Bootstrapper errors
 * - `⠀20xxx`: Plugin loader errors
 * - `⠀40xxx`: Plugin selector errors
 * - `⠀60xxx`: Backend errors
 *
 * Any other error codes are free to be used by anything else.
 *
 * If you provide names for your used error codes (using the `errorCodes` map in your runtime library object),
 * their ranges will be checked against these namespaces.
 *
 * ## Error handling requirements
 *
 * Because this method operates using a thrown exception to jump back to the exit handler at any time,
 * you must let any error thrown by it propagate upwards (you can check using `context.isExitError(err)`)
 *
 * @param code A code to return to the init script.
 * A normal exit (if nothing calls `.exit()` or throws) will use an exit code of zero.
 * Any other value counts as an error.
 * Defaults to `1`.
 */
export function exit(code?: number): never {
    exitImpl(code);
}
