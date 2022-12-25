---
"@radiantpm/runtime-standard-plugin-selector": minor
"@radiantpm/plugin-redis-cache": minor
"@radiantpm/plugin-file-cache": minor
"@radiantpm/runtime-bootstrap": minor
"@radiantpm/plugin-types": minor
"@radiantpm/plugin-github-auth": patch
---

Added support for caching values, which can significantly speed up many operations. Initial release supports local file-based caching for development as well as a caching plugin that uses Redis. The Github authentication plugin has also been updated to use caching to speed up authorisation checks.
