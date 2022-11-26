import assert from "assert";
import {
    AuthenticationCheckResponse,
    AuthenticationListValidResponse,
    Scope
} from "@radiantpm/plugin-types";

export interface ScopeCheckHandlerFunction<
    Params extends unknown[],
    ScopeKind extends Scope["kind"]
> {
    (
        scope: Scope<ScopeKind>,
        ...params: Params
    ): Promise<AuthenticationCheckResponse>;
}

export interface ScopeListValidHandlerFunction<
    Params extends unknown[],
    ScopeKind extends Scope["kind"]
> {
    (
        scopeKind: ScopeKind,
        ...params: Params
    ): Promise<AuthenticationListValidResponse>;
}

interface ScopeHandlerObject<
    Params extends unknown[],
    Kind extends Scope["kind"] = Scope["kind"]
> {
    check: ScopeCheckHandlerFunction<Params, Kind>;
    listValid: ScopeListValidHandlerFunction<Params, Kind>;
}

/**
 * An automatic switch statement for scope handlers
 */
export default class SwitchedScopeHandler<Params extends unknown[] = []> {
    private readonly handlers = new Map<
        Scope["kind"],
        ScopeHandlerObject<Params>
        >();

    register<Kind extends Scope["kind"]>(scopeKind: Kind, handlers: ScopeHandlerObject<Params, Kind>): void {
        this.handlers.set(scopeKind, handlers);
    }

    async check(
        scope: Scope,
        ...params: Params
    ): Promise<AuthenticationCheckResponse> {
        const handler = this.getScopeHandlers(scope.kind);
        return await handler.check(scope, ...params);
    }

    async listValid(
        scopeKind: Scope["kind"],
        ...params: Params
    ): Promise<AuthenticationListValidResponse> {
        const handler = this.getScopeHandlers(scopeKind);
        return await handler.listValid(scopeKind, ...params);
    }

    private getScopeHandlers(
        scopeKind: Scope["kind"]
    ): ScopeHandlerObject<Params> {
        const handler = this.handlers.get(scopeKind);
        assert(handler, `Missing scope handler for ${scopeKind}`);
        return handler;
    }
}
