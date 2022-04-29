export default interface AuthenticationField {
    /**
     * The name of the field parameter in the request
     */
    name: string;

    /**
     * Label to show above the field
     */
    label: string;

    /**
     * HTML input type
     */
    type: string;

    /**
     * Description of the field, to show below it
     */
    description: string;
}
