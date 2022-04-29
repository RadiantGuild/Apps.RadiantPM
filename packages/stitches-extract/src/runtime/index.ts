import {
    ComponentType,
    createElement,
    CSSProperties,
    forwardRef,
    ReactNode
} from "react";
import removeProperties from "./utils/removeProperties";

interface StyledOptions {
    // React display name, dev mode only
    d?: string;

    // Variant to class-name hashing (class names are based on the variant name and value, not the CSS)
    v: Record<string, Record<string, string>>;

    // Dynamic property to variable name hash
    p: Record<string, string>;
}

interface KnownProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

function throwErr(msg: string): never {
    const err = new Error(msg);
    err.name = "stitches-extract runtime err";
    throw err;
}

function makeStyled() {
    return (
        base: ComponentType,
        opts: StyledOptions,
        defaultProps: Record<string, unknown>
    ) => {
        if (process.env.NODE_ENV !== "production") {
            if (!opts.v) throwErr("missing variant property mapping");
            if (!opts.p) throwErr("missing dynamic property mapping");
        }

        const variantNames = Object.keys(opts.v);
        const dynamicNames = Object.keys(opts.p);

        const component = forwardRef(
            (props: Record<string, unknown> & KnownProps, ref) => {
                const variantProps = Object.keys(props).filter(name =>
                    variantNames.includes(name)
                );

                const dynamicProps = Object.keys(props).filter(name =>
                    dynamicNames.includes(name)
                );

                const classes = variantProps.map(
                    name => opts.v[name][props[name] as string]
                );

                const className = [...classes, props.className]
                    .filter(Boolean)
                    .join(" ");

                const variables = Object.fromEntries(
                    dynamicProps.map(name => [opts.p[name], props[name]])
                );

                const style = {...props.style, ...variables};

                const otherProps = removeProperties(props, [
                    ...variantProps,
                    ...dynamicProps,
                    "children"
                ]);

                const newProps = {
                    ...defaultProps,
                    ...otherProps,
                    className,
                    style,
                    ref
                };

                return createElement<Record<string, unknown>>(
                    base,
                    newProps,
                    props.children
                );
            }
        );

        if (process.env.NODE_ENV !== "production") {
            if (opts.d) component.displayName = opts.d;
        }

        return component;
    };
}

export function createStitchesExtract(themes: Record<string, string>) {
    return {
        styled: makeStyled(),
        theme: themes
    };
}
