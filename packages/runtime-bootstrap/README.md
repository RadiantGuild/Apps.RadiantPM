# Bootstrapper

`@radiantpm/runtime-bootstrap` does the initial setup of RadiantPM. It also provides some abstractions for runtime libraries to use, so that the setup experience is more consistent.

The bootstrapper is the only part of RadiantPM that is _not_ interchangable. We may make it be interchangable in the future, but as of writing, it is not planned.

## Usage with a preset

There are some bootstrapper presets that you can use so that you don't have to write your own script. These presets may also provide pre-built Docker images that you can use, so that you don't have to make your own.

Please consult the preset's documentation to see how to use it.

We recommend the [`@radiantpm/standard-runtime`](../standard-runtime/README.md) preset.

## Usage

The bootstrapper requires you to provide a small NodeJS script as the entrypoint to your application. This script will call the bootstrapper, passing it instances of the runtime libraries you have chosen.

Here we have extracted the script from `@radiantpm/standard-bootstrap`:

```ts
import bootstrap from "@radiantpm/runtime-bootstrap";

bootstrap({
    pluginLoader: () => import("@radiantpm/runtime-standard-plugin-loader"),
    pluginSelector: () => import("@radiantpm/runtime-standard-plugin-selector"),
    backend: () => import("@radiantpm/runtime-standard-backend")
});
```
