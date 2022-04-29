# Creating a RadiantPM Backend

Creating a backend for RadiantPM is actually really easy – all it needs to do is load and run middleware plugins.

You will need to install `@radiantpm/backend-utilities`, which exports a function `getPluginsByType`. Inside your request handler, you should call this function (passing `"middleware"` as the only parameter), which will return every loaded middleware plugin.

The first call of this function might take a while, as it has to download and install the dependencies of each plugin. You may want to create an initialisation stage in your backend that calls this once, and waits for it to exit. (Any subsequent calls will return instantly)

For each request, you need to create a `RequestContext`, which middleware will use to get information about the request, write to the response, and store context. Please see the `@radiantpm/plugin-utils` typings, which show what fields and methods are required, and specify where there are utilities to help with implementations.

Now, to run the actual middleware, you first need to find which should actually run on this request. To do this, loop over the middleware plugins and create a new list of plugins that return `true` from their `shouldHandle` function:

```typescript
const matchingPlugins = middlewarePlugins.filter(pl => pl.shouldHandle(req, ctx));
```

If the resulting list is empty, this means that nothing is handling this endpoint, so you should respond with 404 Not Found.

Otherwise, you should now call `runMiddleware` from the backend utilities package, passing it your request context and the list of matching middleware. It will recursively call the middleware and return when they are all complete.

Currently, errors are not automatically handled, so you should wrap this call inside a try/catch, and send some error response if an error is thrown.

