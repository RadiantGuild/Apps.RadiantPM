import {WellKnownData} from "@radiantpm/plugin-types";

let cachedPromise: Promise<WellKnownData> | undefined;
let cachedValue: WellKnownData | undefined;

async function fetchWellKnown() {
    const response = await fetch("/.well-known/radiantpm.json");

    if (response.status === 404) {
        throw new Error("@radiantpm/plugin-api-frontend is not installed");
    }

    if (response.status !== 200) {
        throw new Error(
            `Invalid response code ${response.status} ${response.statusText}`
        );
    }

    try {
        return await response.json();
    } catch (cause) {
        throw new Error("Failed to read well-known response data", {cause});
    }
}

export default async function getWellKnown(): Promise<WellKnownData> {
    if (cachedValue) return cachedValue;
    if (cachedPromise) return await cachedPromise;

    const promise = fetchWellKnown();
    cachedPromise = promise;

    const result = await promise;
    cachedPromise = undefined;
    cachedValue = result;

    return result;
}
