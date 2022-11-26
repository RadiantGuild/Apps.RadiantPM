export default interface BasicUserInfo {
    /**
     * Some human-readable value that identifies the user.
     * For example, their username or email.
     */
    displayIdentifier: string;

    /**
     * A unique identifier for the user.
     * For example, a UUID.
     */
    id: string;

    /**
     * The name the user chose to display to other users.
     */
    displayName?: string;

    /**
     * The user's slug.
     */
    username?: string;

    /**
     * The user's email.
     */
    email?: string;
}
