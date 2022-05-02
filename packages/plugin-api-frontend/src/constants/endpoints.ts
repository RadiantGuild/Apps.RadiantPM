import {ApiEndpoints} from "@radiantpm/plugin-types";
import urljoin from "url-join";

function getUrl(path: string) {
    return urljoin("/api", path) as `/${string}`;
}

type ApiEndpointPaths = {
    [Key in keyof ApiEndpoints]: `/${string}`;
};

const endpoints: ApiEndpointPaths = {
    createFeed: getUrl("feeds"),
    createPackage: getUrl("feeds/[feed_slug]/packages")
};

export default endpoints;
