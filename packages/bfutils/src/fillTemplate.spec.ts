import test from "ava";
import {isMissingParameterError} from "./errors/MissingParameterError";
import fillTemplate from "./fillTemplate";

test("does nothing if there are no template parameters", t => {
    const source = "some string";
    const actual = fillTemplate(source, {}).result;
    t.is(actual, source);
});

test("replaces a single template parameter", t => {
    const source = "some [param] string";
    const expected = "some value string";
    const actual = fillTemplate(source, {param: "value"}).result;
    t.is(actual, expected);
});

test("replaces multiple template parameters", t => {
    const source = "some [p1] string [p2]";
    const expected = "some foo string bar";
    const actual = fillTemplate(source, {p1: "foo", p2: "bar"}).result;
    t.is(actual, expected);
});

test("returns no used keys if none are used", t => {
    const source = "some string";
    const used = fillTemplate(source, {param: "value"}).usedValues;
    t.is(used.size, 0);
});

test("returns used keys", t => {
    const source = "some [param] string";
    const expected = new Set(["param"]);
    const actual = fillTemplate<string>(source, {param: "value"}).usedValues;
    t.deepEqual(actual, expected);
});

test("throws an error if a template parameter does not have a value", t => {
    t.plan(2);

    const source = "some [param] string";

    const error = t.throws(() => {
        fillTemplate(source, {});
    });

    if (error) {
        t.true(isMissingParameterError(error));
    }
});
