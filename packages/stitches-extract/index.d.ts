import {
    ComponentPropsWithoutRef,
    ComponentType,
    CSSProperties,
    ReactHTML,
    ReactNode
} from "react";

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

type StyleObject<Helpers extends string> = CSSProperties &
    {
        [Helper in Helpers]?: string | number;
    };

export type StyledOptions<
    Variants extends never | string,
    Helpers extends string
> = StyleObject<Helpers> & {
    variants?: Record<Variants, CSSProperties>;
    defaultVariants?: Record<Variants, string>;
};

type StyledComponent<
    Base extends keyof ReactHTML | ComponentType,
    Variants extends string
> = ComponentType<
    ComponentPropsWithoutRef<Base> &
        {
            [Key in Variants]?: Key extends keyof ComponentPropsWithoutRef<Base>
                ? never
                : string | boolean;
        } & {
            children?: ReactNode;
            className?: string;
            style?: CSSProperties;
        }
>;

export interface Styled<Helpers extends string> {
    <
        Base extends keyof ReactHTML | ComponentType,
        Variants extends never | string
    >(
        base: Base,
        options: StyledOptions<Variants, Helpers>,
        defaultProps?: ComponentPropsWithoutRef<Base>
    ): StyledComponent<Base, Variants>;
}

export interface StitchesExtract<
    Helpers extends string,
    Themes extends string
> {
    styled: Styled<Helpers>;

    theme: Record<Themes, string>;
}

type TokenObject = {[Type in TokenTypes]?: Record<string, string | number>};

export interface CreateOptions<Helpers extends string, Themes extends string> {
    tokens?: TokenObject;
    helpers?: Record<Helpers, (value: string | number) => unknown>;
    themes?: Record<Themes, TokenObject>;
}

export function createStitchesExtract<
    Helpers extends string,
    Themes extends string
>(options: CreateOptions<Helpers, Themes>): StitchesExtract<Helpers, Themes>;
