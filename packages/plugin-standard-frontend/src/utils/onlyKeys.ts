export function onlyKeys<T, Keys extends readonly (keyof T)[]>(obj: T, keys: Keys): Pick<T, Keys extends (infer KeyVals)[] ? KeyVals : keyof T> {
    return Object.fromEntries(
        Object.entries(obj).filter(([k]) => keys.includes(k as keyof T))
    ) as never;
}
