# @radiantpm/plugin-utils

## 0.2.0-test.0

### Minor Changes

-   Added a method to authentication plugins to load basic information about a user.

-   Added support for extensions to authentication plugins. Extensions allow plugins to register custom scopes that extend the built-in scopes.

-   Added a new request utility function (`redirect`) that sets the appropriate values on a `HeadersHttpResponse` to redirect the user.

-   Added a new request utility function `getBuffer` to read a buffer from a `HttpRequest`.

-   Added a utility `createRequestLogger` to create a middleware plugin that logs every request. It's main purpose is to help with reverse engineering API clients to figure out what routes you need to handle.

### Patch Changes

-   Fixed a bug that caused accept header parsing to crash in some situations.

-   Updated dependencies []:
    -   @radiantpm/plugin-types@0.3.0-test.0

## 0.1.1

### Patch Changes

-   Updated dependencies [[`92bb839`](https://github.com/RadiantPM/RadiantPM/commit/92bb839607e731207231fa999cbcc564c308e23b)]:
    -   @radiantpm/plugin-types@0.2.0

## 0.1.0

### Minor Changes

-   [`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89) Thanks [@Alduino](https://github.com/Alduino)! - Initial package release.

### Patch Changes

-   Updated dependencies [[`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89)]:
    -   @radiantpm/log@0.1.0
    -   @radiantpm/plugin-types@0.1.0
