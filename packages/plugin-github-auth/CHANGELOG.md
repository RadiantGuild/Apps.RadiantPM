# @radiantpm/plugin-github-auth

## 0.2.0

### Minor Changes

-   [#9](https://github.com/RadiantPM/RadiantPM/pull/9) [`9b25e5f`](https://github.com/RadiantPM/RadiantPM/commit/9b25e5ffc15255b2165e47552db07b5c66ff655e) Thanks [@Alduino](https://github.com/Alduino)! - Added support for personal feeds that use your Github username as their slug

### Patch Changes

-   [#11](https://github.com/RadiantPM/RadiantPM/pull/11) [`92bb839`](https://github.com/RadiantPM/RadiantPM/commit/92bb839607e731207231fa999cbcc564c308e23b) Thanks [@Alduino](https://github.com/Alduino)! - Added support for caching values, which can significantly speed up many operations. Initial release supports local file-based caching for development as well as a caching plugin that uses Redis. The Github authentication plugin has also been updated to use caching to speed up authorisation checks.

-   Updated dependencies [[`92bb839`](https://github.com/RadiantPM/RadiantPM/commit/92bb839607e731207231fa999cbcc564c308e23b)]:
    -   @radiantpm/plugin-types@0.2.0
    -   @radiantpm/plugin-utils@0.1.1

## 0.1.0

### Minor Changes

-   [`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89) Thanks [@Alduino](https://github.com/Alduino)! - Initial package release.

### Patch Changes

-   Updated dependencies [[`be7986a`](https://github.com/RadiantGuild/Apps.RadiantPM/commit/be7986a62980476e650169f8ec49445ff1943d89)]:
    -   @radiantpm/log@0.1.0
    -   @radiantpm/plugin-types@0.1.0
    -   @radiantpm/plugin-utils@0.1.0
