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
    slug: string;
}

type Scopes =
    | HomepageViewScope
    | FeedViewScope
    | FeedCreateScope
    | PackageViewScope;

type Scope<Filter extends Scopes["kind"] = Scopes["kind"]> = Extract<
    Scopes,
    {kind: Filter}
>;

export default Scope;

const validScopeKinds: ReadonlySet<Scope["kind"]> = new Set([
    "page.view",
    "feed.view",
    "feed.create",
    "package.view"
]);

export function isValidScopeKind(kind: string): kind is Scope["kind"] {
    return validScopeKinds.has(kind as Scope["kind"]);
}
