import type {ComponentType, CSSProperties, ReactElement} from "react";
import {ComponentPropsWithoutRef, ReactHTML} from "react";

interface PropertyMapping {
    colors: "colors";
    background: "colors";
    backgroundColor: "colors";
    backgroundImage: "colors";
    border: "colors";
    borderBlock: "colors";
    borderBlockEnd: "colors";
    borderBlockStart: "colors";
    borderBottom: "colors";
    borderBottomColor: "colors";
    borderColor: "colors";
    borderInline: "colors";
    borderInlineEnd: "colors";
    borderInlineStart: "colors";
    borderLeft: "colors";
    borderLeftColor: "colors";
    borderRight: "colors";
    borderRightColor: "colors";
    borderTop: "colors";
    borderTopColor: "colors";
    caretColor: "colors";
    color: "colors";
    columnRuleColor: "colors";
    fill: "colors";
    outlineColor: "colors";
    stroke: "colors";
    textDecorationColor: "colors";

    fontFamily: "fonts";

    fontSize: "fontSizes";

    fontWeight: "fontWeights";

    lineHeight: "lineHeights";

    letterSpacing: "letterSpacings";

    borderRadius: "radii";
    borderTopLeftRadius: "radii";
    borderTopRightRadius: "radii";
    borderBottomRightRadius: "radii";
    borderBottomLeftRadius: "radii";

    blockSize: "sizes";
    minBlockSize: "sizes";
    maxBlockSize: "sizes";
    inlineSize: "sizes";
    minInlineSize: "sizes";
    maxInlineSize: "sizes";
    width: "sizes";
    minWidth: "sizes";
    maxWidth: "sizes";
    height: "sizes";
    minHeight: "sizes";
    maxHeight: "sizes";
    flexBasis: "sizes";
    gridTemplateColumns: "sizes";
    gridTemplateRows: "sizes";

    gap: "space";
    gridGap: "space";
    columnGap: "space";
    gridColumnGap: "space";
    rowGap: "space";
    gridRowGap: "space";
    inset: "space";
    insetBlock: "space";
    insetBlockEnd: "space";
    insetBlockStart: "space";
    insetInline: "space";
    insetInlineEnd: "space";
    insetInlineStart: "space";
    margin: "space";
    marginTop: "space";
    marginRight: "space";
    marginBottom: "space";
    marginLeft: "space";
    marginBlock: "space";
    marginBlockEnd: "space";
    marginBlockStart: "space";
    marginInline: "space";
    marginInlineEnd: "space";
    marginInlineStart: "space";
    padding: "space";
    paddingTop: "space";
    paddingRight: "space";
    paddingBottom: "space";
    paddingLeft: "space";
    paddingBlock: "space";
    paddingBlockEnd: "space";
    paddingBlockStart: "space";
    paddingInline: "space";
    paddingInlineEnd: "space";
    paddingInlineStart: "space";
    top: "space";
    right: "space";
    bottom: "space";
    left: "space";
    scrollMargin: "space";
    scrollMarginTop: "space";
    scrollMarginRight: "space";
    scrollMarginBottom: "space";
    scrollMarginLeft: "space";
    scrollMarginX: "space";
    scrollMarginY: "space";
    scrollMarginBlock: "space";
    scrollMarginBlockEnd: "space";
    scrollMarginBlockStart: "space";
    scrollMarginInline: "space";
    scrollMarginInlineEnd: "space";
    scrollMarginInlineStart: "space";
    scrollPadding: "space";
    scrollPaddingTop: "space";
    scrollPaddingRight: "space";
    scrollPaddingBottom: "space";
    scrollPaddingLeft: "space";
    scrollPaddingX: "space";
    scrollPaddingY: "space";
    scrollPaddingBlock: "space";
    scrollPaddingBlockEnd: "space";
    scrollPaddingBlockStart: "space";
    scrollPaddingInline: "space";
    scrollPaddingInlineEnd: "space";
    scrollPaddingInlineStart: "space";

    zIndex: "zIndices";

    boxShadow: "shadows";
    textShadow: "shadows";

    transition: "transitions";

    borderWidth: "borderWidths";
    borderTopWidth: "borderWidths";
    borderRightWidth: "borderWidths";
    borderBottomWidth: "borderWidths";
    borderLeftWidth: "borderWidths";

    borderStyle: "borderStyles";
    borderTopStyle: "borderStyles";
    borderRightStyle: "borderStyles";
    borderBottomStyle: "borderStyles";
    borderLeftStyle: "borderStyles";
}

type TokenTypes = PropertyMapping[keyof PropertyMapping];

type BaseTokens = Record<TokenTypes, string>;
type BaseHelpers = string;
type BaseThemes = string;
type BaseType = keyof ReactHTML | ComponentType;
type BaseVariants = Record<string, string>;
type BaseVariableProps = {required: string, optional: string};

type StringToBoolean<Str> =
    | (Str extends "true" ? true : never)
    | (Str extends "false" ? false : never);

type StyledComponentBaseProps<Type extends keyof ReactHTML | ComponentType> =
    ComponentPropsWithoutRef<Type>;

type StyledComponentVariantProps<
    Variants extends Record<string, string> | never
> = Variants extends never
    ? never
    : {
          [Name in keyof Variants]:
              | Variants[Name]
              | StringToBoolean<Variants[Name]>;
      };

type StyledComponentVariableProps<Variables extends string> = {
    [Name in keyof Variables]: string | number;
};

type StyledComponentProps<
    Type extends keyof ReactHTML | ComponentType,
    Variants extends Record<string, string> | never,
    Variables extends string
> = StyledComponentBaseProps<Type> &
    StyledComponentVariableProps<Variables> &
    StyledComponentVariantProps<Variants>;

interface StyledComponent<
    Type extends keyof ReactHTML | ComponentType,
    Variants extends Record<string, string>,
    Variables extends string
> {
    displayName?: string;

    className: string;
    selector: string;

    (props: StyledComponentProps<Type, Variants, Variables>): ReactElement<
        StyledComponentProps<Type, Variants, Variables>,
        StyledComponent<Type, Variants, Variables>
    >;
}

type CssVariableReference<Name extends string = string> = `--${Name}`;
type VariableReference<Name extends string = string> = `$$${Name}`;
type VariablePropReference<Name extends string = string> = `$@${Name}`;

type TokenReference<
    Property extends string | never,
    Tokens extends BaseTokens
> =
    | (Property extends keyof PropertyMapping
          ? `$${Tokens[PropertyMapping[Property]]}`
          : never)
    | {
          [TokenType in TokenTypes]: `$${TokenType}$${Tokens[TokenType]}`;
      }[TokenTypes];

type PropertyReference<
    Property extends keyof CSSProperties,
    Tokens extends BaseTokens
> =
    | CssVariableReference
    | VariableReference
    | TokenReference<Property, Tokens>
    | VariablePropReference;

type BasicStyles<Tokens extends BaseTokens> = {
    [Property in keyof CSSProperties]:
        | PropertyReference<Property, Tokens>
        | CSSProperties[Property];
};

type HelperStyles<Helpers extends BaseHelpers, Tokens extends BaseTokens> = {
    [Helper in Helpers]: PropertyReference<never, Tokens>;
};

type NestedStyles<Tokens extends BaseTokens, Helpers extends BaseHelpers> = {
    [Path in `${"&" | "@"}${string}`]: StyleObject<Tokens, Helpers>;
};

type StyleObject<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers
> = Partial<
    NestedStyles<Tokens, Helpers> &
        BasicStyles<Tokens> &
        HelperStyles<Helpers, Tokens>
>;

type BaseVariantValues<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers
> = Record<string, StyleObject<Tokens, Helpers>>;

type DefaultVariantValues = BaseVariantValues<BaseTokens, BaseHelpers>;

type GetVariantValues<Values extends DefaultVariantValues> =
    Values extends Record<infer Result, unknown> ? Result : never;

interface StyledBuilder<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    Type extends BaseType,
    VariableProps extends BaseVariableProps,
    Variants extends BaseVariants | never
> {
    withVariant<
        Name extends string,
        Values extends BaseVariantValues<Tokens, Helpers>
    >(
        name: Name,
        values: Values,
        options?: Record<string, never>
    ): StyledBuilder<
        Tokens,
        Helpers,
        Type,
        VariableProps | ExtraVariableProps,
        Variants & {[N in Name]: GetVariantValues<Values>}
    >;

    build(): StyledComponent<Type, Variants, VariableProps>;
}

type BaseStyleObject = StyleObject<BaseTokens, BaseHelpers>;

type InferVariableProps<Styles extends BaseStyleObject> = Styles extends Record<
    string,
    infer Value
>
    ? Value extends VariablePropReference<infer Name>
        ? {required: Name, optional: never}
        : Value extends BaseStyleObject
        ? InferVariableProps<Value>
        : never
    : never;

interface StyledFunction<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers
> {
    /**
     * Creates a React component with some CSS
     * @param type The React component or intrinsic component to base this new component on
     * @param styles Style object containing the styles to set on the component, supporting nesting
     *               (remember to use `as const`)
     * @param defaultProps Default props to apply to the source component
     */ <
        Type extends BaseType,
        Styles extends StyleObject<Tokens, Helpers, BaseVariableProps>
    >(
        type: Type,
        styles: Styles,
        defaultProps?: ComponentPropsWithoutRef<Type>
    ): StyledBuilder<Tokens, Helpers, Type, InferVariableProps<Styles>, never>;
}

interface StitchesExtract<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    Themes extends BaseThemes
> {
    styled: StyledFunction<Tokens, Helpers>;

    /**
     * The class names of the themes provided
     */
    theme: Record<Themes, string>;

    /**
     * Returns the CSS that all the styled components generated
     */
    getCssText(): string;

    // TODO: a function to extend it so that it can be used as a library
}

interface BaseTokensObject {
    [key: keyof TokenTypes]: {
        [token: string]: string | number;
    };
}

interface BaseTokensObjectWithInitTokens<Tokens extends BaseTokens> {
    [key: keyof TokenTypes]: {
        [token: string]: TokenReference<never, Tokens> | string;
    };
}

interface BaseStitchesExtractInitThemes<Tokens extends BaseTokens> {
    [name: string]: BaseTokensObjectWithInitTokens<Tokens>;
}

type StitchesExtractInitHelpers<
    Helpers extends BaseHelpers,
    Tokens extends BaseTokens
> = {
    [Key in Helpers]: (value: string | number) => BasicStyles<Tokens>;
};

interface StitchesExtractInit<
    Tokens extends BaseTokensObject,
    Helpers extends BaseHelpers,
    Themes extends BaseStitchesExtractInitThemes<Tokens>
> {
    tokens: Tokens;
    themes: Themes;
    helpers: StitchesExtractInitHelpers<Helpers, Tokens>;
}

type InferTokens<TokensObject extends BaseTokensObject> = {
    [Type in keyof TokensObject]: keyof TokensObject[Type];
};

type InferThemes<
    ThemesObject extends BaseStitchesExtractInitThemes<BaseTokens>
> = keyof ThemesObject;

type MergeTokens<A extends BaseTokensObject, B extends BaseTokensObject> = {
    [Type in TokenTypes]: A[Type] & B[Type];
};

export function createStitchesExtract<
    Tokens extends BaseTokensObject,
    Helpers extends BaseHelpers,
    Themes extends BaseStitchesExtractInitThemes<Tokens>
>(
    init: StitchesExtractInit<Tokens, Helpers, Themes>
): StitchesExtract<InferTokens<MergeTokens<Tokens, Themes[string]>>, Helpers, InferThemes<Themes>>;

const test = createStitchesExtract({
    tokens: {
        colors: {
            greenLight: "#0f0",
            greenDark: "#070"
        }
    },
    helpers: {
        paddingX: value => ({
            paddingLeft: value,
            paddingRight: value
        })
    },
    themes: {
        light: {
            colors: {
                green: "$greenDark"
            }
        },
        dark: {
            colors: {
                green: "$greenDark"
            }
        }
    }
} as const);

const thing = test.styled("a", {
    color: "$@foo"
}).withVariant("size", {
    lg: {
        fontSize: "$lg"
    },
    sm: {
        fontSize: "$sm"
    }
}).build();
