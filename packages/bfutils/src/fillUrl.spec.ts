import tesk from "ava";
import fillUrl from "./fillUrl";

tesk("returns exact basic path with no params", t => {
    const path = "/basic/path";
    const result = fillUrl(path, {});
    t.is(result, path);
});

tesk("keeps slash at end of path", t => {
    const path = "/basic/path/";
    const result = fillUrl(path, {});
    t.is(result, path);
});

tesk("returns exact basic url with no params", t => {
    const url = "https://my.basic/url";
    const result = fillUrl(url, {});
    t.is(result, url);
});

tesk("keeps query params if no params passed", t => {
    const path = "/basic/path?with=query";
    const result = fillUrl(path, {});
    t.is(result, path);
});

tesk("appends new param to query if there are already some", t => {
    const path = "/basic/path?with=query";
    const expected = "/basic/path?with=query&and=more";
    const actual = fillUrl(path, {and: "more"});
    t.is(actual, expected);
});

tesk("overwrites existing query param", t => {
    const path = "/basic/path?with=query";
    const expected = "/basic/path?with=params";
    const actual = fillUrl(path, {with: "params"});
    t.is(actual, expected);
});

tesk("creates query string if there were no existing query params", t => {
    const path = "/basic/path";
    const expected = "/basic/path?with=query";
    const actual = fillUrl(path, {with: "query"});
    t.is(actual, expected);
});

tesk("replaces single path param with value in the middle", t => {
    const path = "/basic/[param]/path";
    const expected = "/basic/value/path";
    const actual = fillUrl(path, {param: "value"});
    t.is(actual, expected);
});

tesk("replaces single path param with value at the end", t => {
    const path = "/basic/[param]";
    const expected = "/basic/value";
    const actual = fillUrl(path, {param: "value"});
    t.is(actual, expected);
});

tesk("replaces multiple path params with values", t => {
    const path = "/basic/[p1]/[p2]";
    const expected = "/basic/foo/bar";
    const actual = fillUrl(path, {p1: "foo", p2: "bar"});
    t.is(actual, expected);
});

tesk("puts params that are not in path in query", t => {
    const path = "/basic/[param]";
    const expected = "/basic/foo?query=bar";
    const actual = fillUrl(path, {param: "foo", query: "bar"})
    t.is(actual, expected);
});

tesk("throws if expecting a path param that isn't provided", t => {
    const path = "/basic/[param]";

    t.throws(() => {
        fillUrl(path, {anotherParam: "foo"});
    });
});

tesk("throws if a path and not absolute", t => {
    const path = "basic/path";

    t.throws(() => {
        fillUrl(path, {});
    });
});
