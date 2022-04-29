function* duplicateItems<T>(
    list: Iterable<T>,
    getCount: (item: T) => number
): IterableIterator<T> {
    for (const item of list) {
        const count = getCount(item);

        for (let i = 0; i < count; i++) {
            yield item;
        }
    }
}

export class ReadonlyHeaders {
    readonly #map: ReadonlyMap<string, readonly string[]>;

    /**
     * Create a new headers object. The map is used by ref. Each key must be all
     * lower-case.
     */
    constructor(map: ReadonlyMap<string, readonly string[]>) {
        this.#map = map;
    }

    /**
     * Creates a new ReadonlyHeaders object based on the passed headers. The
     * value is cloned, with all keys converted to lower-case.
     */
    static from(
        headers: Iterable<[string, string | undefined | readonly string[]]>
    ): ReadonlyHeaders {
        const clone = new Map(
            Array.from(headers)
                .filter(([, v]) => v)
                .map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v : [v]])
        );

        return new ReadonlyHeaders(clone);
    }

    /**
     * Gets the value of every header with the specified name
     */
    getAll(name: string): readonly string[] {
        return this.getOrEmpty(name);
    }

    /**
     * Gets the value of the first header that has the specified name
     */
    get(name: string): string | undefined {
        return this.getOrEmpty(name)[0];
    }

    /**
     * @returns the number of headers that exist with the specified name
     */
    count(name: string): number {
        return this.getOrEmpty(name).length;
    }

    /**
     * @returns true if there is a header with the specified name, false if there is not
     */
    has(name: string): boolean {
        return this.count(name) !== 0;
    }

    /**
     * @returns the data as a list of `[name, [...values]]`
     */
    entries(): IterableIterator<[string, readonly string[]]> {
        return this.#map.entries();
    }

    /**
     * @param grouped If false, each header name will appear based on the number of values it has.
     * If true, it will only appear once.
     *
     * @returns a list of every header name
     */
    keys(grouped = true): IterableIterator<string> {
        const keys = this.#map.keys();

        if (grouped) {
            return keys;
        } else {
            return duplicateItems(keys, item => this.count(item));
        }
    }

    /**
     * @returns a list of every header value
     */
    values(): IterableIterator<readonly string[]> {
        return this.#map.values();
    }

    private getOrEmpty(name: string): readonly string[] {
        name = name.toLowerCase();

        if (this.#map.has(name)) {
            return this.#map.get(name) as readonly string[];
        }

        return [];
    }
}

export default class Headers extends ReadonlyHeaders {
    readonly #map;

    /**
     * Create a new `Headers` object.
     * If a source is passed, it is cloned; however, the keys will not be converted into lowercase.
     * You should use `.from` instead if you want to initialise it with a value.
     *
     * @param source - Use `Headers.from` instead of passing this value
     */
    constructor(source?: Iterable<readonly [string, readonly string[]]>) {
        const map = new Map<string, readonly string[]>(source ?? []);
        super(map);
        this.#map = map;
    }

    /**
     * Creates a new `Headers` object based on the passed headers.
     * The value is cloned, with all keys converted to lowercase.
     */
    static from(
        headers: Iterable<[string, string | undefined | readonly string[]]>
    ): Headers {
        const clone = new Map(
            Array.from(headers)
                .filter(([, v]) => v)
                .map(([k, v]) => [k.toLowerCase(), Array.isArray(v) ? v : [v]])
        );

        return new Headers(clone);
    }

    /**
     * Adds a header with the specified name and value
     */
    add(name: string, value: string): void {
        this.addAll(name, [value]);
    }

    /**
     * Adds a header per value with the specified name
     */
    addAll(name: string, values: readonly string[]): void {
        const arr = this.getOrCreate(name);
        this.setAll(name, [...arr, ...values]);
    }

    /**
     * Sets a header to the specified name and value.
     * If there is already one or more headers with the specified name, they will be removed and replaced with this one.
     */
    set(name: string, value: string): void {
        this.setAll(name, [value]);
    }

    /**
     * Sets a header to have the specified values.
     * If there are already headers, they will be removed.
     */
    setAll(name: string, values: readonly string[]): void {
        this.#map.set(name, values);
    }

    /**
     * Removes the header with the specified name and value
     * @returns true if the header was deleted, false if there was no header with that name or value
     */
    delete(name: string, value: string): boolean {
        const headers = this.getAll(name);
        const index = headers.indexOf(value);
        if (index === -1) return false;

        const newItems = [
            ...headers.slice(0, index),
            ...headers.slice(index + 1)
        ];

        this.setAll(name, newItems);
        return true;
    }

    /**
     * Removes all headers with the specified name
     * @returns true if headers were deleted, false if there were no headers with that name
     */
    deleteAll(name: string): boolean {
        return this.#map.delete(name);
    }

    private getOrCreate(name: string): readonly string[] {
        name = name.toLowerCase();

        if (this.#map.has(name)) {
            return this.#map.get(name) as readonly string[];
        }

        const arr: string[] = [];
        this.#map.set(name, arr);

        return arr;
    }
}
