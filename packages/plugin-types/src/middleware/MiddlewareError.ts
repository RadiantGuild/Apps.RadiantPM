interface Extensions {
    /**
     * The name of the plugin export that owns the middleware plugin that threw
     * this error
     */
    pluginExportName: string;

    /**
     * The name of the plugin itself, if it provided one
     */
    pluginName?: string;

    /**
     * If this value is true, the error message must be hidden anywhere that the
     * error is displayed (e.g. in logs, on website error pages)
     */
    isMessageSensitive: boolean;
}

type MiddlewareError = Error & Extensions;
export default MiddlewareError;
