import {useLocalId} from "@radiantguild/form-contexts";
import {useCombobox, UseComboboxReturnValue} from "downshift";
import Fuse from "fuse.js";
import {ReactElement, useEffect, useState} from "react";
import {ChevronDown} from "react-bootstrap-icons";
import {styled} from "~/stitches.config";
import {focusedShadowBorder} from "~/utils/style-helpers";

const Outline = styled("div", {
    position: "absolute",
    zIndex: 2,
    top: 0,
    left: 0,
    right: 0,
    height: "$$height",
    shadowBorder: "$colors$shadowBorder",
    pointerEvents: "none",
    borderRadius: "3px",
    trans: {
        height: "easeOut faster"
    }
});

Outline.displayName = "Outline";

const DropdownContainer = styled("div", {
    position: "absolute",
    zIndex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    top: "$$height",
    left: 0,
    right: 0,
    height: 0,
    fontSize: "$$fontSize",
    pointerEvents: "none",
    opacity: 0,
    backgroundColor: "$listItemBackground",
    trans: {
        height: "easeOut faster"
    }
});

DropdownContainer.displayName = "Dropdown";

const DropdownItemLabel = styled("div", {
    padding: "$1 $2",
    userSelect: "none",
    "&:hover": {
        backgroundColor: "$listItemHoverBackground"
    },
    "&[aria-selected='true']": {
        backgroundColor: "$listItemActiveBackground"
    }
});

DropdownItemLabel.displayName = "DropdownItemLabel";

const EmptyLabel = styled("p", {
    opacity: 0.8,
    textAlign: "center"
});

const Textbox = styled("input", {
    flexGrow: 1,
    width: 0,
    border: "none",
    backgroundColor: "transparent",
    color: "$text",
    fontSize: "$$fontSize",
    "&:focus": {
        outline: "none"
    }
});

Textbox.displayName = "Textbox";

const TextboxContainer = styled("div", {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "$2",
    padding: "0 $2",
    height: "$$height"
});

TextboxContainer.displayName = "TextboxContainer";

const Container = styled("div", {
    $$width: "$sizes$64",
    $$height: "$sizes$7",
    $$expansionHeight: "$sizes$48",
    $$fontSize: "0.875rem",

    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    width: "$$width",
    height: "$$height",
    borderRadius: "3px",
    backgroundColor: "$listItemBackground",
    trans: {
        height: "easeOut faster"
    },

    variants: {
        isOpen: {
            true: {
                [`& > ${Outline}`]: {
                    focusedShadowBorder: "$colors$shadowBorder",
                    height: "calc($$height + $$expansionHeight)"
                },
                [`& > ${DropdownContainer}`]: {
                    pointerEvents: "auto",
                    height: "$$expansionHeight",
                    opacity: 1
                },
                [`& > ${TextboxContainer}`]: {
                    borderBottom: "1px solid $border"
                },
                [`& > ${TextboxContainer}:focus-within`]: {
                    borderBottom: "1px solid $borderFocus"
                }
            }
        }
    }
});

Container.displayName = "Container";

const OpenButton = styled("button", {
    color: "$text",
    background: "transparent",
    border: "none",
    outline: "none",
    display: "flex",
    alignItems: "center",
    padding: 0,
    "&:focus": {
        ...focusedShadowBorder
    }
});

OpenButton.displayName = "OpenButton";

interface DropdownItemProps {
    value: string;
    index: number;
    combobox: UseComboboxReturnValue<string>;
}

function DropdownItem({
    value,
    index,
    combobox
}: DropdownItemProps): ReactElement {
    const itemProps = combobox.getItemProps({item: value, index});

    return (
        <>
            <DropdownItemLabel {...itemProps}>{value}</DropdownItemLabel>
        </>
    );
}

export interface SelectProps {
    items: string[];
    placeholder?: string;

    onChange(value: string): void;
}

export function Select({
    items,
    placeholder,
    onChange
}: SelectProps): ReactElement {
    const [displayedItems, setDisplayedItems] = useState(items);

    const idOverride = useLocalId();

    const combobox = useCombobox({
        items: displayedItems,
        inputId: idOverride,
        onInputValueChange({inputValue}) {
            if (!inputValue) {
                setDisplayedItems(items);
                return;
            }

            const fuse = new Fuse(items);
            const filteredItems = fuse.search(inputValue).map(el => el.item);
            setDisplayedItems(filteredItems);
        }
    });

    const comboboxProps = combobox.getComboboxProps();
    const inputProps = combobox.getInputProps();
    const buttonProps = combobox.getToggleButtonProps();
    const menuProps = combobox.getMenuProps();

    useEffect(() => {
        if (!combobox.selectedItem) return;
        onChange(combobox.selectedItem);
    }, [combobox.selectedItem, onChange]);

    return (
        <Container {...comboboxProps} isOpen={combobox.isOpen}>
            <Outline />
            <TextboxContainer>
                <Textbox {...inputProps} placeholder={placeholder} />
                <OpenButton
                    {...buttonProps}
                    type="button"
                    aria-label="Toggle dropdown"
                >
                    <ChevronDown />
                </OpenButton>
            </TextboxContainer>
            <DropdownContainer {...menuProps}>
                {items.length > 0 ? (
                    displayedItems.length > 0 ? (
                        displayedItems.map((item, i) => (
                            <DropdownItem
                                key={item}
                                combobox={combobox}
                                value={item}
                                index={i}
                            />
                        ))
                    ) : (
                        <EmptyLabel>Nothing matches the filter</EmptyLabel>
                    )
                ) : (
                    <EmptyLabel>Nothing here</EmptyLabel>
                )}
            </DropdownContainer>
        </Container>
    );
}
