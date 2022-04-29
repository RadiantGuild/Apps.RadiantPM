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
type BaseVariableProps = string;

type StringToBoolean<Str> =
    | (Str extends "true" ? true : never)
    | (Str extends "false" ? false : never);

type StyledComponentBaseProps<Type extends keyof ReactHTML | ComponentType> =
    ComponentPropsWithoutRef<Type>;

type StyledComponentVariantProps<Variants extends Record<string, string>> = {
    [Name in keyof Variants]: Variants[Name] | StringToBoolean<Variants[Name]>;
};

type StyledComponentVariableProps<Variables extends string> = {
    [Name in keyof Variables]: string | number;
};

type StyledComponentProps<
    Type extends keyof ReactHTML | ComponentType,
    Variants extends Record<string, string>,
    Variables extends string
> = StyledComponentBaseProps<Type> &
    StyledComponentVariableProps<Variables> &
    StyledComponentVariantProps<Variants>;

interface StyledComponent<
    Type extends keyof ReactHTML | ComponentType,
    Variants extends Record<string, string>,
    Variables extends string
> {
    className: string;
    selector: string;

    (props: StyledComponentProps<Type, Variants, Variables>): ReactElement<
        StyledComponentProps<Type, Variants, Variables>,
        StyledComponent<Type, Variants, Variables>
    >;
}

type CssVariableReference = `--${string}`;

type VariableReference = `$$${string}`;

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

type VariablePropReference<VariableProps extends BaseVariableProps> =
    `$@${VariableProps}`;

type PropertyReference<
    Property extends keyof CSSProperties,
    Tokens extends BaseTokens,
    VariableProps extends BaseVariableProps | never
> =
    | CssVariableReference
    | VariableReference
    | TokenReference<Property, Tokens>
    | (VariableProps extends never
          ? never
          : VariablePropReference<VariableProps>);

type BasicStyles<
    Tokens extends BaseTokens,
    VariableProps extends BaseVariableProps | never
> = {
    [Property in keyof CSSProperties]:
        | PropertyReference<Property, Tokens, VariableProps>
        | CSSProperties[Property];
};

type HelperStyles<
    Helpers extends BaseHelpers,
    Tokens extends BaseTokens,
    VariableProps extends BaseVariableProps
> = {
    [Helper in Helpers]: PropertyReference<never, Tokens, VariableProps>;
};

type StyleObject<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps
> = Partial<
    HelperStyles<Helpers, Tokens, VariableProps> &
        NestedStyles<Tokens, Helpers, VariableProps> &
        BasicStyles<Tokens, VariableProps>
>;

type NestedStyles<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps
> = {
    [Path in `&${string}`]: StyleObject<Tokens, Helpers, VariableProps>;
};

type BaseVariantsObject<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps
> = Record<string, Record<string, StyleObject<Tokens, Helpers, VariableProps>>>;

type DefaultVariantsObject<Variants extends BaseVariantsObject> = {
    [Name in keyof Variants]?: Variants[Name];
};

interface VariantSettings<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps,
    Variants extends BaseVariantsObject<Tokens, Helpers, VariableProps>
> {
    variants: Variants;
    defaultVariants: DefaultVariantsObject<Variants>;
}

interface StyleSettings<Tokens, Helpers, VariableProps> {
    styles: StyleObject<Tokens, Helpers, VariableProps>;
}

type InferVariants<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps,
    Variants extends BaseVariantsObject<Tokens, Helpers, VariableProps>
> = Variants extends Record<infer Names, unknown>
    ? {
          [Name in Names]: Variants[Name] extends Record<infer Values, unknown>
              ? Values
              : never;
      }
    : never;

type SettingsObject<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    VariableProps extends BaseVariableProps,
    Variants extends BaseVariantsObject
> = VariantSettings<Tokens, Helpers, VariableProps, Variants> &
    StyleSettings<Tokens, Helpers, VariableProps>;

type InferVariantsObject<
    Settings extends SettingsObject<
        BaseTokens,
        BaseHelpers,
        BaseVariableProps,
        BaseVariantsObject<BaseTokens, BaseHelpers, BaseVariableProps>
    >
> = Settings["variants"];

type InferVariableProps<
    Settings extends SettingsObject<
        BaseTokens,
        BaseHelpers,
        BaseVariableProps,
        BaseVariantsObject<BaseTokens, BaseHelpers, BaseVariableProps>
    >
> = Settings extends SettingsObject<
    BaseTokens,
    BaseHelpers,
    infer VariableProps,
    BaseVariantsObject<BaseTokens, BaseHelpers, BaseVariableProps>
>
    ? VariableProps
    : never;

interface StyledFunction<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers
> {
    <
        Type extends BaseType,
        Settings extends SettingsObject<
            Tokens,
            Helpers,
            BaseVariableProps,
            BaseVariantsObject<Tokens, Helpers, BaseVariableProps>
        >
    >(
        type: Type,
        settings: Settings,
        defaultProps?: ComponentPropsWithoutRef<Type>
    ): StyledComponent<
        Type,
        InferVariants<InferVariantsObject<Settings>>,
        InferVariableProps<Settings>
    >;
}

type BaseTokensObject = {
    [Type in keyof Tokens]?: {
        [token: string]: string | number;
    };
};

type StitchesExtractInitThemes<
    Themes extends BaseThemes,
    Tokens extends BaseTokensObject
> = {
    [Theme in Themes]: Tokens;
};

type StitchesExtractInitHelpers<
    Helpers extends BaseHelpers,
    Tokens extends BaseTokens
> = {
    [Key in Helpers]: (value: string | number) => BasicStyles<Tokens, never>;
};

interface StitchesExtractInit<
    Tokens extends BaseTokensObject,
    Helpers extends BaseHelpers,
    Themes extends BaseThemes,
    ThemeTokens extends BaseTokensObject
> {
    tokens: Tokens;
    helpers: StitchesExtractInitHelpers<Helpers, Tokens & ThemeTokens>;
    themes: StitchesExtractInitThemes<Themes, ThemeTokens>;
}

interface StitchesExtract<
    Tokens extends BaseTokens,
    Helpers extends BaseHelpers,
    Themes extends BaseThemes,
    ThemeTokens extends BaseTokens
> {
    /**
     * Creates a React component with some CSS
     */
    styled: StyledFunction<Tokens & ThemeTokens, Helpers>;

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

type InferTokens<TokensObject extends BaseTokensObject> = {
    [Type in keyof TokensObject]: TokensObject[Type] extends Record<
        infer Tokens,
        unknown
    >
        ? Tokens
        : {invalid: true; tokens: TokensObject[Type]};
};

export function createStitchesExtract<
    Tokens extends BaseTokensObject,
    Helpers extends BaseHelpers,
    Themes extends BaseThemes,
    ThemeTokens extends BaseTokensObject
>(
    init: StitchesExtractInit<Tokens, Helpers, Themes, ThemeTokens>
): StitchesExtract<
    InferTokens<Tokens>,
    Helpers,
    Themes,
    InferTokens<ThemeTokens>
>;
