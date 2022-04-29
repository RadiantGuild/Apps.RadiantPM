const validationScopesArray = [
    "feed.display-name",
    "feed.slug"
] as const;

export type ValidationScope = typeof validationScopesArray[number];

export const validationScopes = new Set<ValidationScope>(validationScopesArray);
