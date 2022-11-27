export type CustomScope = {
    kind: `${string}:${string}`;
} & Record<string, string>;

interface PageViewScope<Page extends string> {
    kind: "page.view";
    page: Page;
}

type HomepageViewScope = PageViewScope<"homepage">;

interface FeedViewScope {
    kind: "feed.view";
    slug: string;
}

interface FeedCreateScope {
    kind: "feed.create";
    slug: string;
}

interface PackageViewScope {
    kind: "package.view";
    feedSlug: string;
    slug: string;
}

interface PackageUpdateScope {
    kind: "package.update";
    feedSlug: string;
    slug: string;
}

interface PackageCreateScope {
    kind: "package.create";
    type: string;
    feedSlug: string;
    slug: string;
    repository?: string;
}

type Scopes =
    | CustomScope
    | HomepageViewScope
    | FeedViewScope
    | FeedCreateScope
    | PackageViewScope
    | PackageUpdateScope
    | PackageCreateScope;

type Scope<Filter extends Scopes["kind"] = Scopes["kind"]> = Extract<
    Scopes,
    {kind: Filter}
>;

export default Scope;

const validScopeKinds: ReadonlySet<Scope["kind"]> = new Set<Scope["kind"]>([
    "page.view",
    "feed.view",
    "feed.create",
    "package.view",
    "package.update",
    "package.create"
]);

export function isValidScopeKind(kind: string): kind is Scope["kind"] {
    return kind.startsWith("custom:") || validScopeKinds.has(kind as Scope["kind"]);
}
