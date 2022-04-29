# Official Plugins

RadiantPM comes with some official plugins, which includes the "standard" plugins that most people will use, as well as some plugins that we use for development at The Radiant Guild.

## Standard Plugins

These are the plugins that you will want to include in any installation of RadiantPM. Of course you are free to use alternatives if you wish, but most of the ecosystem is designed around these plugins.

### `@radiantpm/standard-plugin-loader`

This is not so much a plugin, however it is included here as it is an interchangable part of RadiantPM.

The standard plugin loader provides a default implementation that loads plugins from a directory specified by an environment variable, using the `main` field in the plugin's `package.json` file.

Please note that the `@radiantpm/plugin-standard-plugin-loader-config` plugin (or compatible) must be installed.

### `@radiantpm/standard-backend`

Again this isn't a plugin, but it is also interchangable so it is included here.

The standard backend runs a HTTP server (based on Koa) that calls each middleware recursively.

### `@radiantpm/plugin-standard-frontend`

This plugin provides a frontend for RadiantPM, which you can use to create, configure, and view feeds and packages. The frontend is based on Vite and React.

You don't need this plugin to be able to use RadiantPM, you can communicate with it using the API instead, but if humans are going to interact with RadiantPM directly, it is recommended.

This plugin requires that an `std01`-compatible plugin loader is installed (e.g. `@radiantpm/standard-plugin-loader`), and that an `std01`-compatible backend is installed (e.g. `@radiantpm/standard-backend`).

### `@radiantpm/plugin-default-response`

This plugin provides middleware that runs after all other middleware, which simply throws a 404 HTTP error, so that something can give a response if no other middleware runs.

It is recommended to install `@radiantpm/plugin-error-handler` as well, to give a more user-friendly response, and to prevent the error from propagating all the way to the backend.

### `@radiantpm/plugin-error-handler`

This plugin handles any errors thrown in middleware, and displays a message to the user (in HTML or JSON, depending on the request's `Accept` header).

It also provides a special error class which can set a specific status code and message for the response.

## Storage Plugins

These plugins provide a way to store any assets, as well as middleware that can be used to access those assets over HTTP.

A storage plugin can support different categories of asset. These are currently:

- `static`: Any static files that won't change (e.g. the logo of the website)

- `pkg`: An package's files, which can be uploaded or downloaded by a user

### `@radiantpm/plugin-local-storage`

This is the simplest storage plugin, simply saving files to a directory. It supports both `static` and `pkg` asset storage.

## Authentication Plugins

### `@radiantpm/plugin-github-auth`

This plugin maps feeds to Github users and organisations, and packages to a repository. Users log in with a Github access token, and can then only see things that they could see on Github too.

## Database plugins

These plugins provide relational, non-file data storage.

### `@radiantpm/plugin-knex-database`

This plugin stores data in any database supported by Knex.

Note: database not included (except for SQLite)
