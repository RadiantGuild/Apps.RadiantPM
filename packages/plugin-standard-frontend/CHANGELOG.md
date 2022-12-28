# @radiantpm/plugin-standard-frontend

## 0.2.0-test.0

### Minor Changes

-   Added a new well-known route that redirects to the login page, at `/.well-known/rpm-login`. Any search parameters that are set will also be included in the redirect URL.

-   Added a new well-known route that redirects to a page that states that authentication was successful. All query parameters are kept in the redirect.

-   Added support for logging into external applications. This involves setting a return URL and an app name as query parameters when redirecting to the login page. If these are set, logging in will ask the user to confirm that they want to give access to the specified application.

### Patch Changes

-   Updated dependencies []:
    -   @radiantpm/plugin-types@0.3.0-test.0
    -   @radiantpm/plugin-utils@0.2.0-test.0
    -   @radiantpm/frontend-utilities@0.1.2-test.0
    -   @radiantpm/plugin-error-handler@0.1.2-test.0
    -   @radiantpm/serve-static@0.1.2-test.0
    -   @radiantpm/bfutils@0.1.1-test.0

## 0.1.3

### Patch Changes

-   [`a4e0281`](https://github.com/RadiantPM/RadiantPM/commit/a4e028194b1324021cd6773da176bd8c6bd266ec) Thanks [@Alduino](https://github.com/Alduino)! - Fixed many issues caused by upgrading `vite-plugin-ssr`

## 0.1.2

### Patch Changes

-   [`337529c`](https://github.com/RadiantPM/RadiantPM/commit/337529c1c176b1b8aea7b4ec55fcbb814e4cad02) Thanks [@Alduino](https://github.com/Alduino)! - Fixed a build issue causing the plugin to error on init

-   Updated dependencies [[`d56ee7a`](https://github.com/RadiantPM/RadiantPM/commit/d56ee7a722c213219abb7b6806dcbf0807d70409)]:
    -   @radiantpm/plugin-types@0.2.1

## 0.1.1

### Patch Changes

-   [#9](https://github.com/RadiantPM/RadiantPM/pull/9) [`9b25e5f`](https://github.com/RadiantPM/RadiantPM/commit/9b25e5ffc15255b2165e47552db07b5c66ff655e) Thanks [@Alduino](https://github.com/Alduino)! - Fixed select boxes overflowing when there's too many items

-   Updated dependencies [[`92bb839`](https://github.com/RadiantPM/RadiantPM/commit/92bb839607e731207231fa999cbcc564c308e23b)]:
    -   @radiantpm/plugin-types@0.2.0
    -   @radiantpm/frontend-utilities@0.1.1
    -   @radiantpm/plugin-error-handler@0.1.1
    -   @radiantpm/plugin-utils@0.1.1
    -   @radiantpm/serve-static@0.1.1

## 0.1.0

### Minor Changes

-   [`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89) Thanks [@Alduino](https://github.com/Alduino)! - Initial package release.

### Patch Changes

-   Updated dependencies [[`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89)]:
    -   @radiantpm/bfutils@0.1.0
    -   @radiantpm/frontend-utilities@0.1.0
    -   @radiantpm/log@0.1.0
    -   @radiantpm/plugin-error-handler@0.1.0
    -   @radiantpm/plugin-types@0.1.0
    -   @radiantpm/plugin-utils@0.1.0
    -   @radiantpm/serve-static@0.1.0
