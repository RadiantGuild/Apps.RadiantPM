import {useCallback, useMemo, useState, useTransition} from "react";

type State<Result> =
    | {loading: false; result: undefined}
    | {loading: false; result: Result}
    | {loading: true; promise: Promise<Result>};

const initialState: State<never> = {loading: false, result: undefined};

export interface UseAsyncSuspenseResult<Arguments extends unknown[], Result> {
    /**
     * If this call is in the Suspense transition, this value is `true`
     */
    isLoading: boolean;

    /**
     * Calls the function passed as `fn`
     */
    execute(...args: Arguments): Promise<Result>;

    /**
     * Returns the result, or undefined if `execute` hasn't been called yet
     */
    read(): Result | undefined;
}

export default function useAsyncSuspense<Arguments extends unknown[], Result>(
    fn: (...args: Arguments) => Promise<Result>
): UseAsyncSuspenseResult<Arguments, Result> {
    const [isLoading, startTransition] = useTransition();

    const [state, setState] = useState<State<Result>>(initialState);

    const execute = useCallback(
        async (...args: Arguments) => {
            const promise = fn(...args);

            startTransition(() => {
                setState({
                    loading: true,
                    promise
                });
            });

            const result = await promise;

            setState({
                loading: false,
                result
            });

            return result;
        },
        [fn]
    );

    const read = useCallback(() => {
        if (state.loading) throw state.promise;
        return state.result;
    }, [state]);

    return useMemo(
        () => ({
            execute,
            isLoading: isLoading || state.loading,
            read
        }),
        [execute, isLoading, state, read]
    );
}
