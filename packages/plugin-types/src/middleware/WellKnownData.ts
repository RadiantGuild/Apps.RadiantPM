import {SerialisableAuthenticationPlugin} from "../authentication";
import {Feed, Package} from "../database";
import {FileCategory, SerialisableStoragePlugin} from "../storage";
import {SerialisableValidationPlugin} from "../validation";
import {ApiEndpoint} from "./ApiEndpoint";
import {MaybeErrorResponse} from "./MaybeErrorResponse";

export interface ApiEndpoints {
    /**
     * Creates a feed with the specified information if the user has permission.
     *
     * ## Request
     * - **Method**: `POST`
     * - **Body**: A `Feed` object
     *
     * ## Successful Response
     * The feed was created successfully.
     *
     * - **Status code**: 201
     * - **Body**: A `MaybeErrorResponse` where `success` is `true`
     *
     * ## Error: already exists
     * The feed couldn't be created as another feed is already using the specified slug.
     *
     * - **Status code**: 409
     * - **Body**: A `MaybeErrorResponse` where `success` is `false`
     *
     * ## Error: not allowed
     * The feed couldn't be created as the user doesn't have permission.
     *
     * - **Status code**: 403
     * - **Body**: A `MaybeErrorResponse` where `success` is `false`
     */
    createFeed: ApiEndpoint<"POST", never, never, Feed, MaybeErrorResponse>;

    /**
     * Creates a package with the specified information if the user has permission.
     *
     * ## Request
     * - **Method**: `POST`
     * - **Params**:
     *   - `feed_slug`: The slug of the feed that this package should be created under
     * - **Body**: A `Package` object
     *
     * ## Successful Response
     * The package was created successfully.
     *
     * - **Status code**: 201
     * - **Body**: A `MaybeErrorResponse` where `success` is `true`
     *
     * ## Error: already exists
     * The package couldn't be created as another package is already using the specified slug.
     *
     * - **Status code**: 409
     * - **Body**: A `MaybeErrorResponse` where `success` is `false`
     *
     * ## Error: not allowed
     * The package couldn't be created as the user doesn't have permission.
     *
     * - **Status code**: 403
     * - **Body**: A `MaybeErrorResponse` where `success` is `false`
     *
     * ## Error: feed not found
     * The package couldn't be created as the feed doesn't exist,
     * or the user doesn't have permission to see that feed.
     *
     * - **Status code**: 404
     * - **Body**: A `MaybeErrorResponse` where `success` is `false`
     */
    createPackage: ApiEndpoint<
        "POST",
        "feed_slug",
        never,
        Package,
        MaybeErrorResponse
    >;
}

/**
 * The object that's exposed at `/.well-known/radiantpm.json`.
 *
 * Frontends must listen for GET requests at that endpoint and return this object, or depend on another frontend to do it.
 */
export default interface WellKnownData {
    plugins: {
        authentication: SerialisableAuthenticationPlugin;
        storage: {
            [Category in FileCategory]?: SerialisableStoragePlugin;
        };
        validation: SerialisableValidationPlugin;
    };

    endpoints: ApiEndpoints;
}
