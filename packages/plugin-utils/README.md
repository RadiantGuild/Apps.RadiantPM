# RadiantPM Plugin Utilities

This package contains utilities for use when creating RadiantPM plugins.

## About Plugins

A plugin in RadiantPM is an object containing certain properties based on what type it is. Depending on its type, a plugin can do many things - respond to HTTP requests, authenticate a user, store files, etc.

When you install a plugin for use in your RadiantPM instance, usually this will actually be a "metaplugin", which is a list of sub-plugins that work together to form the plugin you download. For instance, you might install the local store plugin, but this in fact is comprised of a `StoragePlugin` that handles the reading and writing of assets on the server-side, and a `MiddlewarePlugin` that adds an API to allow users to do read the files too.

There are three different types of plugins:

### Middleware plugins

Middleware plugins are extremely powerful, as they allow you to handle any API requests to RadiantPM. Basically every metaplugin will contain one of these, as it is required to interface with the user.

The interface you need to fill to create a middleware plugin is extremely simple, there are only two methods you need to implement.

#### `shouldHandle(req: NextApiRequest): boolean`

Use this function as a precursor check to see if you actually want to handle a request. You have access to the full request here, and you should return either `true` if you want to handle it, or `false` if you do not.

#### `handle(req: NextApiRequest, res: NextApiResponse, next: () => Promise<void>)`

This method is called when the server gets an API request, and `shouldHandle` has returned `true`. By the time your function has finished executing, either `res.end()` or `next()` must have been called, otherwise the request will hang.

The `next()` function calls the next middleware along, in the order that the user has specified them, until RadiantPM's default handler which gives a 404 error.

#### Simple routed middleware plugins

If your middleware plugin uses a simple router, you can use `createRouteMiddlewarePlugin`, which takes a `route` parameter in the form of a HTTP request line (e.g. `GET /path` or `POST /[foo]`) and a `handle` parameter in the same form as a normal middleware plugin's handle parameter. You can use variables in the path in the same way as with a NextJS route, and their values will be added to the query object.

```typescript
import {createRouteMiddlewarePlugin} from "@radiantpm/plugin-utils";
const middlewarePlugin = createRouteMiddlewarePlugin("GET /api/ping", (_, res) => res.end("PONG"));
```

If you are using classes, there is also a `RouteMiddlewarePlugin` abstract class that you can extend to do the same thing.

If you have multiple routes, you can just return many middleware plugins as a metaplugin, each with a single route.

### Storage plugins

Storage plugins specify how RadiantPM should save the various files it needs to store. A storage plugin could write to the local file system, something like AWS S3, or even a database. There can only be one storage plugin enabled at any time.

Storage plugins need to fill the following interface:

#### `write(category: FileCategory, sha: string, content: Buffer)`

This method is called by RadiantPM when it needs to save a file. It is passed the category of the file (which, for now, is always `package`), the shasum of the file (useful for specifying the file's name), and the contents that should be written. It can be an async function.

#### `read(category: FileCategory, sha: string): Buffer`

This method is called when RadiantPM needs to read a file on the server-side. It's passed the file's category as well as the shasum. Feel free to throw an error if the file does not exist. It can be an async function.

#### `getUrl(category: FileCategory, sha: string): string`

This method should return a URL which, when requested with a `GET` request, returns the contents of the file the same as `read()` would. This method is used when a client needs to be passed a URL to load the file from (e.g. for npm feeds). It can be an async function.

If this URL is just the path portion, it will usually be relative to the domain that RadiantPM is being hosted on (depending on the client). We have yet to see a client that does not do this, though you might want to return a full URL just in case.

### Authentication plugins

Authentication plugins provide a way to only allow certain people to do actions. They function on scope-like basis - each action has some scope (often with context data) which you can use to decide if a user is authenticated.

Authentication plugins need to be careful about what context they are run in, as some methods are run in the browser and some are run on the server. Make sure that any client-side methods do not use NodeJS-only modules, and that server-side methods do not use browser APIs. You may also want to wrap each method in an `if (typeof window === "undefined")` for server-side-only methods if you find NextJS won't compile it properly.

Authentication plugins need to fill the following interface:

#### `name: string`

This field is a unique identifier for the plugin that should be URL-safe, e.g. `gitlab`.

#### `displayName: string`

This field is the name of the plugin, as shown to the user, e.g. `GitLab`.

#### `loginUrl: string`

This endpoint is used to create an access token for a user when they log in, or give an error message if their credentials are invalid.

The field specifies the path part of a URL that points to a path that middleware plugin should handle. A `POST` request will be sent to the endpoint when the user attempts to log in, with a dictionary with keys from the fields that `getFields()` returns, and the values that the user entered for each field (always a string), as JSON in the request body. The endpoint must return a JSON object that conforms to the `AuthenticationLoginResponse` type.

#### `loginChangedUrl?: string`

This endpoint is used to validate the values the user entered - don't log them in here, only check for things like "does the username field have a value", "does the password have at least 10 characters". The endpoint should respond as quickly as possible to improve latency for the user.

If you do not want to validate the fields, don't set the field to anything.

The field specifies the path part of a URL that points to a path that a middleware plugin should handle. A `POST` request will be sent to the endpoint whenever the user types something new into a field on the login page, with a dictionary with keys from the fields that `getFields()` returns, and the values that the user entered for each field (always a string), as JSON in the request body. The endpoint must return a JSON object that conforms to the `AuthenticationLoginChangedResponse` type.

#### `checkUrl: string`

This endpoint is used to validate that a user has permission to do a certain action.

The field specifies the path part of a URL that points to a path that a middleware should handle. A `GET` request will be sent to the endpoint on nearly every client-side action to check that they are allowed to do it. There are two query parameters passed to the request: `accessToken` - the value you return from the `loginUrl` endpoint, and `scope`, which is a base64 encoded JSON object with a value specified in the `Scope` type. The endpoint must return a JSON object that conforms to the `AuthenticationCheckResponse` type.

The endpoint should return the same result that calling `check()` would have with the same access token and scope.

#### `isRequiredUrl?: string`

This endpoint is used to see if authentication is required for a certain scope. If it is, RadiantPM will redirect the user to the login page. The endpoint will only be called if the user is not logged in already (`checkUrl` will be used instead).

The field specifies the path part of a URL that points to a path that a middleware should handle. A `GET` request will be sent to the endpoint on nearly every client-side action for unauthenticated users, to see if they need to be logged in to do that action. There is one query parameter passed to the endpoint: `scope`, a base64 encoded JSON object with a value specified in the `Scope` type. The endpoint must return a JSON object that conforms to the `AuthenticationRequiredResponse` type.

If this field is defined, the `isRequired()` method must be too.

#### `check(accessToken: string, scope: Scope): AuthenticationCheckResponse`

This method does the same thing as the endpoint at `checkUrl`, except it is used when the check is performed server-side. It can be an async method.

#### `isRequired?(scope: Scope): boolean`

This method must exist if `isRequiredUrl` is set. It should also return the same thing as that endpoint (although just the boolean value, not wrapped in an object). It is used when the check is performed server-side. It can be an async method.

#### `getFields(): AuthenticationField[]`

This method returns a list of fields to display on the login page. It can be an async method.

#### `getHelpText?(): string`

This method returns help text about the login process that is displayed to the user. It can be an async method.

#### Helper method to create auth plugins

Creating an authentication plugin can be quite tedious, as you need to create a middleware plugin that handles the URLs correctly, and there is functionality duplication between some of the endpoints for client- and server-side calls. Because of this, there is a helper function to create both an authentication and middleware plugin at the same time, which handles everything properly.

This function is called `createAuthPlugin`. When you call it, you pass an object that contains pretty much the same keys as a normal `AuthenticationPlugin`, e