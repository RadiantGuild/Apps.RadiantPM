import assert from "assert";
import {fillUrl} from "@radiantpm/bfutils";
import {createLogger} from "@radiantpm/log";
import HttpError from "@radiantpm/plugin-error-handler/http-error";
import {
    AuthenticationPlugin,
    DatabasePlugin,
    HttpRequest,
    PackageHandlerPlugin,
    PluginExport,
    StoragePlugin
} from "@radiantpm/plugin-types";
import {
    createRouteMiddlewarePlugin,
    RoutedRequestContext
} from "@radiantpm/plugin-utils";
import {getJson, setJson} from "@radiantpm/plugin-utils/req-utils";
import hasha from "hasha";
import Untargz from "./utils/Untargz";

interface CouchLoginBody {
    name: string;
    password: string;
}

let authPlugin: AuthenticationPlugin;
let dbPlugin: DatabasePlugin;
let pkgStoragePlugin: StoragePlugin;

const logger = createLogger("plugin-npm");

interface PackageName {
    /**
     * The scope of the package, or null if it doesn't have one
     */
    scope: string | null;

    /**
     * The name of the package, or null if it has an invalid format
     */
    name: string | null;
}

interface PushRequestPackageJson {
    _integrity: string;
    _from: string;
}

interface PushRequestAttachment {
    content_type: string;
    data: string;
    length: number;
}

interface PushRequest {
    name: string;
    description: string;
    "dist-tags": Record<string, string>;
    versions: Record<string, PushRequestPackageJson>;
    _attachments: Record<string, PushRequestAttachment>;
}

function parsePackageName(decodedPackageNameInclScope: string): PackageName {
    const match = decodedPackageNameInclScope.match(
        /(?:@(?<scope>[^/]+)\/)?(?<name>.+)/
    );

    if (!match) {
        return {scope: null, name: null};
    }

    return {
        scope: match.groups?.scope ?? null,
        name: match.groups?.name ?? null
    };
}

function getNpmAccessToken(req: HttpRequest) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.substring("Bearer ".length);

    if (!authHeader.startsWith("Bearer ") || !token) {
        throw new HttpError(400, "Authorization header is not a bearer token");
    }

    return token;
}

const handlerPlugin: PackageHandlerPlugin = {
    type: "package-handler",
    packageType: "npm",
    feedSlugMatches(packageName: string, feedSlug: string) {
        const {scope} = parsePackageName(packageName);
        if (!scope) return false;

        // TODO support more conversions

        return scope === feedSlug.toLowerCase();
    },
    getPackageName(packageName: string) {
        const {name} = parsePackageName(packageName);
        if (!name) throw new Error("Invalid package name");
        return name;
    }
};

const pluginExport: PluginExport<never, false> = {
    configIsRequired: false,

    onMetaLoaded(meta) {
        authPlugin = meta.selectedPlugins.authentication;
        dbPlugin = meta.selectedPlugins.database;
        pkgStoragePlugin = meta.selectedPlugins.storage.pkg;
    },

    init() {
        return [
            handlerPlugin,
            createRouteMiddlewarePlugin(
                "PUT /-/npm/[feed_slug]/-/user/[user_id]",
                async (ctx: RoutedRequestContext) => {
                    const feed = ctx.params.get("feed_slug");
                    assert(feed, "Missing feed_slug");

                    const {name, password} = await getJson<CouchLoginBody>(
                        ctx.req
                    );

                    if (!name || !password) {
                        logger.trace(
                            "Invalid request - username or password are missing"
                        );

                        throw new HttpError(
                            400,
                            "Username or password are missing"
                        );
                    }

                    // require that the user has access to the feed
                    const feedAccess = await authPlugin.check(password, {
                        kind: "feed.view",
                        slug: feed
                    });

                    // and check that the feed actually exists
                    const feedExists = !!(await dbPlugin.getFeedIdFromSlug(
                        feed
                    ));

                    if (!feedAccess.success || !feedExists) {
                        logger.trace(
                            "Invalid request - either the feed doesn't exist or the user doesn't have access to it"
                        );

                        throw new HttpError(
                            404,
                            "Feed not found, or you may not have access to it"
                        );
                    }

                    logger.trace("Login successful");

                    await setJson(ctx.res, 200, {
                        token: password
                    });
                },
                "npm login"
            ),
            createRouteMiddlewarePlugin(
                "GET /-/npm/[feed_slug]/[package_name_incl_scope]",
                async (ctx: RoutedRequestContext) => {
                    const feedSlug = ctx.params.get("feed_slug");
                    assert(feedSlug, "Missing feed_slug");

                    const packageNameInclScope = ctx.params.get(
                        "package_name_incl_scope"
                    );

                    assert(
                        packageNameInclScope,
                        "Missing package_name_incl_scope"
                    );

                    const decodedPackageNameInclScope =
                        decodeURIComponent(packageNameInclScope);

                    const {scope, name: packageSlug} = parsePackageName(
                        decodedPackageNameInclScope
                    );

                    if (!scope || !packageSlug) {
                        throw new HttpError(
                            400,
                            "Missing scope in package name"
                        );
                    }

                    if (!handlerPlugin.feedSlugMatches(packageSlug, feedSlug)) {
                        throw new HttpError(
                            400,
                            "Scope does not match the feed slug"
                        );
                    }

                    const accessToken = getNpmAccessToken(ctx.req);

                    const canViewFeed = await authPlugin.check(accessToken, {
                        kind: "feed.view",
                        slug: feedSlug
                    });

                    const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);

                    if (!canViewFeed.success || !feedId) {
                        throw new HttpError(
                            404,
                            "Feed does not exist or you don't have permission to see it"
                        );
                    }

                    const canViewPackage = await authPlugin.check(accessToken, {
                        kind: "package.view",
                        feedSlug,
                        slug: packageSlug
                    });

                    const packageId = await dbPlugin.getPackageIdFromSlug(
                        feedId,
                        packageSlug
                    );

                    if (!canViewPackage.success || !packageId) {
                        throw new HttpError(
                            404,
                            "Package does not exist or you don't have permission to see it"
                        );
                    }

                    // TODO: Test that this works

                    const pkg = await dbPlugin.getPackageFromId(packageId);

                    const simpleVersions =
                        await dbPlugin.listVersionsFromPackage(packageId);

                    const versions = await Promise.all(
                        simpleVersions.map(async ({slug}) => {
                            const id = await dbPlugin.getVersionId(
                                packageId,
                                slug
                            );
                            assert(
                                id,
                                "Package has version but version does not exist"
                            );
                            return await dbPlugin.getVersionFromId(id);
                        })
                    );

                    const distTags = Object.fromEntries(
                        versions.flatMap(version =>
                            version.tags.map(tag => [tag, version.slug])
                        )
                    );

                    const versionObjects = Object.fromEntries(
                        await Promise.all(
                            versions.map(async version => {
                                const packageJsonObj = JSON.parse(
                                    version.metafile
                                );

                                const filledAssetUrl = fillUrl(
                                    pkgStoragePlugin.assetUrl,
                                    {
                                        category: "pkg",
                                        id: version.assetHash
                                    }
                                );

                                const tarballHash = await pkgStoragePlugin.hash(
                                    "sha512",
                                    "pkg",
                                    version.assetHash
                                );

                                const tarballHashB64 = Buffer.from(
                                    tarballHash,
                                    "hex"
                                ).toString("base64");

                                return [
                                    version.slug,
                                    {
                                        ...packageJsonObj,
                                        dist: {
                                            tarball: filledAssetUrl,
                                            integrity: `sha512-${tarballHashB64}`
                                        }
                                    }
                                ];
                            })
                        )
                    );

                    const versionCreationTimes = Object.fromEntries(
                        versions.flatMap(version => {
                            const date = version.creationDate.toUTCString();

                            return [
                                [version.slug, date],
                                ...version.tags.map(tag => [tag, date])
                            ];
                        })
                    );

                    const latestVersion =
                        versions.find(ver => ver.slug === distTags.latest) ??
                        versions.at(-1);

                    assert(
                        latestVersion,
                        "Package does not have a latest version"
                    );

                    const baseInfo = {
                        description: pkg.description,
                        readme: latestVersion.readme
                    };

                    await setJson(ctx.res, 200, {
                        ...baseInfo,
                        "dist-tags": distTags,
                        versions: versionObjects,
                        time: versionCreationTimes
                    });
                }
            ),
            createRouteMiddlewarePlugin(
                "PUT /-/npm/[feed_slug]/[package_name_incl_scope]",
                async (ctx: RoutedRequestContext) => {
                    const feedSlug = ctx.params.get("feed_slug");
                    assert(feedSlug, "Missing feed_slug");

                    const packageNameInclScope = ctx.params.get(
                        "package_name_incl_scope"
                    );

                    assert(
                        packageNameInclScope,
                        "Missing package_name_incl_scope"
                    );

                    const decodedPackageNameInclScope =
                        decodeURIComponent(packageNameInclScope);

                    const {scope, name: packageSlug} = parsePackageName(
                        decodedPackageNameInclScope
                    );

                    if (!scope || !packageSlug) {
                        throw new HttpError(
                            400,
                            "Missing scope in package name"
                        );
                    }

                    if (handlerPlugin.feedSlugMatches(packageSlug, feedSlug)) {
                        throw new HttpError(
                            400,
                            "Scope does not match the feed slug"
                        );
                    }

                    const accessToken = getNpmAccessToken(ctx.req);

                    const canViewFeed = await authPlugin.check(accessToken, {
                        kind: "feed.view",
                        slug: feedSlug
                    });

                    const feedId = await dbPlugin.getFeedIdFromSlug(feedSlug);

                    if (!canViewFeed.success || !feedId) {
                        throw new HttpError(
                            404,
                            "Feed does not exist or you don't have permission to see it"
                        );
                    }

                    const canCreatePackage = await authPlugin.check(
                        accessToken,
                        {
                            kind: "package.update",
                            feedSlug,
                            slug: packageSlug
                        }
                    );

                    const packageId = await dbPlugin.getPackageIdFromSlug(
                        feedId,
                        packageSlug
                    );

                    if (!canCreatePackage.success || !packageId) {
                        throw new HttpError(
                            404,
                            "Package does not exist, or you don't have permission to see it, or you don't have permission to push to it"
                        );
                    }

                    const pushRequest = await getJson<PushRequest>(ctx.req);

                    if (Object.keys(pushRequest.versions).length !== 1) {
                        throw new HttpError(
                            400,
                            "Multiple version uploads is not supported"
                        );
                    }

                    const version = Object.keys(pushRequest.versions)[0];

                    const existingVersion = await dbPlugin.getVersionId(
                        packageId,
                        version
                    );

                    if (existingVersion) {
                        throw new HttpError(409, "Version already exists");
                    }

                    if (
                        Object.values(pushRequest["dist-tags"]).some(
                            val => val !== version
                        )
                    ) {
                        throw new HttpError(
                            400,
                            "A dist tag points to a different version"
                        );
                    }

                    const tags = Object.keys(pushRequest["dist-tags"]);

                    const versionPkgJson = pushRequest.versions[version];

                    if (!versionPkgJson._from.startsWith("file:")) {
                        throw new HttpError(400, "_from is not a file name");
                    }

                    if (Object.keys(pushRequest._attachments).length !== 1) {
                        throw new HttpError(
                            400,
                            "Only one attachment can be uploaded"
                        );
                    }

                    const attachment = Object.values(
                        pushRequest._attachments
                    )[0];

                    if (
                        attachment.content_type !== "application/octet-stream"
                    ) {
                        throw new HttpError(
                            400,
                            "Content types other than application/octet-stream are currently not supported"
                        );
                    }

                    const fileBuffer = Buffer.from(attachment.data, "base64");

                    if (fileBuffer.length !== attachment.length) {
                        throw new HttpError(
                            400,
                            "Attachment length does match"
                        );
                    }

                    if (!versionPkgJson._integrity.startsWith("sha512-")) {
                        throw new HttpError(
                            400,
                            "Hashing methods other than sha512 are currently not supported"
                        );
                    }

                    const expectedHashB64 = versionPkgJson._integrity.substring(
                        "sha512-".length
                    );
                    const actualHash = await hasha.async(fileBuffer, {
                        algorithm: "sha512",
                        encoding: "base64"
                    });

                    if (actualHash !== expectedHashB64) {
                        throw new HttpError(
                            400,
                            "Attachment failed integrity check"
                        );
                    }

                    const sourceFiles = await Untargz.fromBuffer(fileBuffer, {
                        include: [
                            "package/readme.md",
                            "package/readme.txt",
                            "package/package.json"
                        ],
                        caseInsensitive: true
                    });

                    const packageDir = sourceFiles.getDir("package");

                    const readmeFileName = packageDir.firstThatExists([
                        "README.md",
                        "README.txt"
                    ]);

                    if (!readmeFileName) {
                        throw new HttpError(
                            400,
                            "Missing README, which must be either a txt or md file"
                        );
                    }

                    const readme = packageDir.getFile(readmeFileName);

                    assert(
                        readme,
                        "Readme file existed but then stopped existing"
                    );

                    const readmeSource = readme.toString("utf8");

                    const packageJson = await packageDir.getFile(
                        "package.json"
                    );

                    if (!packageJson) {
                        throw new HttpError(400, "Missing package.json");
                    }

                    const packageJsonSource = packageJson.toString("utf8");

                    const assetId = await pkgStoragePlugin.write(
                        "pkg",
                        fileBuffer
                    );

                    await dbPlugin.createVersion(packageId, {
                        slug: version,
                        description: pushRequest.description,
                        creationDate: new Date(),
                        tags,
                        assetHash: assetId,
                        readme: readmeSource,
                        readmeType: readmeFileName.endsWith(".md")
                            ? "md"
                            : "txt",
                        metafile: packageJsonSource
                    });

                    await setJson(ctx.res, 200, {
                        success: true
                    });
                }
            )
        ];
    }
};

export default pluginExport;
