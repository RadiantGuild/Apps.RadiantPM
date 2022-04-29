export default function removeProperties<
    T extends Record<string, unknown>,
    R extends string
>(obj: T, props: R[]): string extends R ? T : Omit<T, R> {
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => !props.includes(k as R))
    ) as T;
}
