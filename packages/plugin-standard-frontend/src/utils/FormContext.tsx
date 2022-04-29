import {
    createContext,
    ReactElement,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

interface FormButtonsContext {
    invalidFields: readonly string[];
    values: Record<string, string>;
}

const FormButtonsContext = createContext<FormButtonsContext | null>(null);

interface FormInputsContext {
    setValid(name: string, isValid: boolean): void;

    setValue(name: string, value: string): void;
}

const FormInputsContext = createContext<FormInputsContext | null>(null);

export interface FormContextProps {
    children: ReactNode;
}

export function FormContext({children}: FormContextProps): ReactElement {
    const [values, setValues] = useState<Record<string, string>>({});
    const [invalidFields, setInvalidFields] = useState<readonly string[]>([]);

    const setValue = useCallback(
        (name: string, value: string) => {
            setValues(values => ({
                ...values,
                [name]: value
            }));
        },
        [setValues]
    );

    const setValid = useCallback(
        (name: string, isValid: boolean) => {
            setInvalidFields(prev => {
                const withoutThis = prev.filter(v => v !== name);

                if (isValid) return withoutThis;
                else return [...withoutThis, name];
            });
        },
        [setInvalidFields]
    );

    const buttonsContext = useMemo<FormButtonsContext>(
        () => ({
            values,
            invalidFields
        }),
        [values, invalidFields]
    );

    const inputsContext = useMemo<FormInputsContext>(
        () => ({
            setValue,
            setValid
        }),
        [setValue, setValid]
    );

    return (
        <FormButtonsContext.Provider value={buttonsContext}>
            <FormInputsContext.Provider value={inputsContext}>
                {children}
            </FormInputsContext.Provider>
        </FormButtonsContext.Provider>
    );
}

export function useFormInput(): FormInputsContext {
    const ctx = useContext(FormInputsContext);
    if (!ctx) throw new Error("Missing <FormContext>");

    return ctx;
}

export function useFormButtons(): FormButtonsContext {
    const ctx = useContext(FormButtonsContext);
    if (!ctx) throw new Error("Missing <FormContext>");

    return ctx;
}
