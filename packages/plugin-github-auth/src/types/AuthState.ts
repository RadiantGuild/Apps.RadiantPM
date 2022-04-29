export interface LoggedInAuthState {
    readonly isLoggedIn: true;
    readonly username: string;
}

export interface LoggedOutAuthState {
    readonly isLoggedIn: false;
}

export type AuthState = LoggedInAuthState | LoggedOutAuthState;
