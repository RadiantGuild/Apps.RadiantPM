# Stitches Extract: Vite Plugin

This folder contains the source code for stitches-extract's Vite build plugin.

Here's a high-level overview of what it does:

1. The plugin looks through the local dependencies of a page to find calls to `createStitchesExtract` and then any calls to its result `styled` function in any JS or TS file

2. It generates the CSS for that component and each of its variants, with class names based on the passed displayname (in dev mode) and a hash of the properties

3. The calls to the `styled` function are replaced with calls to the runtime, which don't include the style object

It will also do similar to the themes and root tokens that you define in the `createStitchesExtract` function - the theme values will be replaced with their class name, and the root tokens will be added to the `:root` declaration.

In your app you can then add a `<style>` element whose value is `stitchesExtract.getCssText()` and it will replace this function call with the CSS that was generated.

## Small example

Say your source code was:

```typescript
import {styled} from "@radiantpm/stitches-extract";

const Text = styled("p", {
    color: "$text"
});

const Heading = styled(Text, {
    // value from theme or tokens
    fontFamily: "$heading",
    // value from a local variable set in a variant or a parent
    fontSize: "$$size"

    // each one of these is a prop - lvl 1 is prop name, lvl 2 is value
    variants: {
        size: {
            lg: {
                // sets the value of the size local variable
                $$size: "$fontSize$lg",

                // a normal CSS variable name to use with other libs
                weight: "--weight"
            }
        },
        customColour: {
            // this variant will be applied if either customColor={true}
            // or customColor="true"
            true: {
                // references the colour from a prop using CSS vars
                color: "$@colour"
            }
        }
    }
}, {
    // default props
    as: "h1"
});

function MyComponent() {
    return (
        <Heading size="lg" customColor color="green" />
    );
}
```

In development the build result would be something like:

```js
// that file
import {styled} from "@radiantpm/stitches-extract/runtime";

const Text = styled("p", "abcdef", {
    // display name
    d: "Text"
});

const Heading = styled(Text, "fedcba", {
    d: "Heading",
    // variant to class hash mapping
    v: {
        size: {
            lg: "abcdef"
        },
        customColour: {
            true: "defabc"
        }
    },
    // list of css props
    p: ["colour"],
}, {
    as: "h1"
});
```

```css
/* getCssText() result */
.se-Text-abcdef {
    color: var(--se-colour-text);
}

.se-Heading-fedcba {
    font-family: var(--se-font-family-heading);
    font-size: var(--se-local-size);
}

.se-Heading-size-lg-fedcba-abcdef {
    --se-local-size: var(--se-font-size-lg);
}

.se-Heading-customColour-true-fedcba-defabc {
    color: var(--se-prop-colour);
}
```

And in production:

```jsx
// that file
import {styled} from "@radiantpm/stitches-extract/runtime";

const Text = styled("p", "abcdef");

const Heading = styled(Text, "fedcba", {
    v: {
        size: {
            lg: "abcdef"
        },
        customColour: {
            true: "defabc"
        }
    },
    // css prop to var name hash mapping
    p: {
        colour: "abcdef"
    },
}, {
    as: "h1"
});

function MyComponent() {
    return (
        <Heading size="lg" customColor color="green" />
    );
}

// (note: will render (in prod):)
<h1
    className="se-abcdef se-fedcba se-fedcba-abcdef se-fedcba-defabc"
    style="--se-p-abcdef:green"
/>
```

```css
/* getCssText() result */
.se-abcdef {
    /* variable name is the hash of its name */
    color: var(--se-abcdef);
}

.se-fedcba {
    font-family: var(--se-fedcba);
    /* --_ means it is a local variable */
    font-size: var(--se--abcdef);
}

.se-fedcba-abcdef {
    --se-_abcdef: var(--s-defabc);
}

.se-fedcba-defabc {
    /* -p- means it is a prop variable */
    color: var(--se-p-abcdef);
}
```
