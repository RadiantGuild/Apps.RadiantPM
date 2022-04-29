/**
 * A validator that has custom logic
 */
export interface CustomValidator {
    kind: "custom";
    message: string;

    validate(source: string): Promise<boolean>;
}
