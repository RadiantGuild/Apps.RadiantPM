const categories = [
    "static",
    "pkg"
] as const;

export const fileCategories = new Set(categories);

export type FileCategory = (typeof categories)[number];
