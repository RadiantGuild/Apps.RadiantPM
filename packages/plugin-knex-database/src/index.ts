import {resolve} from "path";
import {createLogger} from "@radiantpm/log";
import {
    Feed,
    Package,
    PluginExport,
    SimpleFeed,
    SimplePackage,
    SimpleVersion,
    Version
} from "@radiantpm/plugin-types";
import {createDbPlugin} from "@radiantpm/plugin-utils";
import knex from "knex";
import {v4 as uuid} from "uuid";
import {Knex, KnexConfig} from "./knex-type";
import {DatabaseSchema, migrate} from "./migrations";

declare module "knex/types/tables" {
    interface Tables {
        feeds: DatabaseSchema["feeds"];
        packages: DatabaseSchema["packages"];
        versions: DatabaseSchema["versions"];
        package_tags: DatabaseSchema["package_tags"];
    }
}

const LATEST_TAG = "latest";

const logger = createLogger("plugin-knex-database");
const knexLogger = createLogger("plugin-knex-database:knex");
const queryLogger = createLogger("plugin-knex-database:query");

function createPlugin(db: Knex) {
    return createDbPlugin({
        id: "db",

        async listFeeds(): Promise<readonly SimpleFeed[]> {
            queryLogger.trace("Listing feeds");

            const result = await db("feeds")
                .leftJoin("packages", "feeds.id", "=", "packages.feed_id")
                .groupBy("feeds.id")
                .select("feeds.slug as slug", "feeds.name as name")
                .count({
                    packages_count: "packages.id"
                });

            return result.map(({slug, name, packages_count}) => ({
                slug,
                name,
                packagesCount: packages_count
            }));
        },

        async getFeedFromId(id: string): Promise<Feed> {
            queryLogger.trace("Getting feed by ID %s", id);

            return db("feeds").where("id", id).first("slug", "name");
        },

        async getFeedIdFromSlug(slug: string): Promise<string | undefined> {
            queryLogger.trace("Getting feed ID based on slug %s", slug);

            const feed = await db("feeds").where("slug", slug).first("id");

            return feed?.id;
        },

        async createFeed(feed: Feed): Promise<void> {
            queryLogger.trace("Creating feed with slug %s", feed.slug);

            await db("feeds").insert({
                ...feed,
                id: uuid()
            });
        },

        async listPackagesFromFeed(
            feedId: string
        ): Promise<readonly SimplePackage[]> {
            queryLogger.trace("Listing packages from feed %s", feedId);

            const result = (await db("packages")
                .leftJoin("versions", "packages.id", "=", "versions.package_id")
                .leftJoin(
                    "package_tags",
                    "packages.id",
                    "=",
                    "package_tags.package_id"
                )
                // TODO: Figure out why `as never` is required
                .where({
                    "package_tags.tag": LATEST_TAG,
                    "packages.feed_id": feedId
                } as never)
                .orWhere({
                    "package_tags.tag": null,
                    "packages.feed_id": feedId
                } as never)
                .groupBy("packages.id")
                .select({
                    package_slug: "packages.slug",
                    package_name: "packages.name",
                    package_type: "packages.type",
                    package_description: "packages.description",
                    latest_version_id: "package_tags.version_id"
                })
                .max({
                    last_updated: "versions.creation_date"
                })
                .count({
                    versions_count: "versions.id"
                })) as {
                package_slug: string;
                package_name: string;
                package_type: string;
                package_description: string;
                versions_count: number;
                latest_version_id: string;
                last_updated: number;
            }[];

            return result.map(item => ({
                slug: item.package_slug,
                name: item.package_name,
                type: item.package_type,
                description: item.package_description,
                versionsCount: item.versions_count,
                latestVersion: item.latest_version_id,
                lastUpdated: new Date(item.last_updated)
            }));
        },

        async getPackageFromId(id: string): Promise<Package> {
            queryLogger.trace("Getting package from ID %s", id);

            return db("packages")
                .where("id", id)
                .first("slug", "name", "description", "repository");
        },

        async getPackageIdFromSlug(
            feedId: string,
            slug: string
        ): Promise<string | undefined> {
            queryLogger.trace(
                "Getting package ID based on slug %s in feed %s",
                slug,
                feedId
            );

            const pkg = await db("packages")
                .where("feed_id", feedId)
                .andWhere("slug", slug)
                .first("id");

            return pkg?.id;
        },

        async createPackage(feedId: string, pkg: Package): Promise<void> {
            queryLogger.trace(
                "Creating package with slug %s in feed %s",
                pkg.slug,
                feedId
            );

            await db("packages").insert({
                ...pkg,
                id: uuid(),
                feed_id: feedId
            });
        },

        async listVersionsFromPackage(
            packageId: string
        ): Promise<readonly SimpleVersion[]> {
            queryLogger.trace("Listing versions of package %s", packageId);

            const result = await db("versions")
                .where("package_id", packageId)
                .select("slug", "description", "creation_date");

            return result.map(({slug, description, creation_date}) => ({
                slug,
                description,
                creationDate: creation_date
            }));
        },

        async getVersionId(
            packageId: string,
            version: string
        ): Promise<string | undefined> {
            queryLogger.trace(
                "Getting version ID based on slug %s in package %s",
                version,
                packageId
            );

            const vers = await db("versions")
                .where("package_id", packageId)
                .andWhere("slug", version)
                .first("id");

            return vers?.id;
        },

        async getVersionFromId(id: string): Promise<Version> {
            queryLogger.trace("Getting version from ID %s", id);

            const {
                slug,
                description,
                creation_date,
                asset_hash,
                readme,
                readme_type,
                metafile
            } = await db("versions")
                .where("id", id)
                .first(
                    "slug",
                    "description",
                    "creation_date",
                    "asset_hash",
                    "readme",
                    "readme_type",
                    "metafile"
                );

            const tags = await db("package_tags")
                .where("version_id", id)
                .select("tag");

            return {
                slug,
                description,
                creationDate: creation_date,
                assetHash: asset_hash,
                readme,
                readmeType: readme_type,
                metafile,
                tags: tags.map(({tag}) => tag)
            };
        },

        async createVersion(
            packageId: string,
            version: Version
        ): Promise<void> {
            queryLogger.trace(
                "Creating version %s in package %s",
                version.slug,
                packageId
            );

            const id = uuid();

            await db("versions").insert({
                id: id,
                package_id: packageId,
                creation_date: new Date(),
                slug: version.slug,
                description: version.description,
                readme: version.readme,
                readme_type: version.readmeType,
                asset_hash: version.assetHash
            });

            for (const tag of version.tags) {
                const existingTag = await db("package_tags")
                    .first("package_id")
                    .where({
                        package_id: packageId,
                        tag
                    });

                if (existingTag) {
                    await db("package_tags")
                        .update({
                            version_id: id
                        })
                        .where({
                            package_id: packageId,
                            tag
                        });
                } else {
                    await db("package_tags").insert({
                        package_id: packageId,
                        tag,
                        version_id: id
                    });
                }
            }
        }
    });
}

function getKnexConnection(db: Configuration["db"]): KnexConfig {
    switch (db.client) {
        case "sqlite":
            logger.info("Loading SQLite database from %s", resolve(db.path));
            return {
                client: "better-sqlite3",
                useNullAsDefault: true,
                connection: db.path
            };
        case "postgres":
            logger.info(
                "Connecting to PostgreSQL database at %s@%s:%s/%s",
                db.connection.user,
                db.connection.host,
                db.connection.port,
                db.connection.database
            );
            return {
                client: "pg",
                connection: db.connection
            };
        case "mysql":
            logger.info(
                "Connecting to MySQL/MariaDB database at %s@%s:%s/%s",
                db.connection.user,
                db.connection.host,
                db.connection.port,
                db.connection.database
            );
            return {
                client: "mysql2",
                connection: db.connection
            };
        case "oracle":
            logger.info(
                "Connecting to Oracle Database at %s@%s:%s/%s",
                db.connection.user,
                db.connection.host,
                db.connection.port,
                db.connection.database
            );
            return {
                client: "oracledb",
                connection: db.connection
            };
        case "mssql":
            logger.info(
                "Connecting to TDS database at %s@%s:%s/%s",
                db.connection.user,
                db.connection.host,
                db.connection.port,
                db.connection.database
            );
            return {
                client: "tedius",
                connection: db.connection
            };
    }
}

interface Configuration {
    db:
        | {
              client: "sqlite";
              path: string;
          }
        | {
              client: "postgres" | "mysql" | "mssql" | "oracle";
              connection: {
                  host: string;
                  port: number;
                  user: string;
                  password: string;
                  database: string;
              };
          };
}

const pluginExport: PluginExport<Configuration, true> = {
    configIsRequired: true,
    configSchema: {
        type: "object",
        required: ["db"],
        properties: {
            db: {
                anyOf: [
                    {
                        type: "object",
                        required: ["client", "path"],
                        properties: {
                            client: {
                                type: "string",
                                const: "sqlite"
                            },
                            path: {
                                type: "string"
                            }
                        }
                    },
                    {
                        type: "object",
                        required: ["client", "connection"],
                        properties: {
                            client: {
                                type: "string",
                                enum: ["postgres", "mysql", "mssql", "oracle"]
                            },
                            connection: {
                                type: "object",
                                required: [
                                    "host",
                                    "port",
                                    "user",
                                    "password",
                                    "database"
                                ],
                                properties: {
                                    host: {
                                        type: "string"
                                    },
                                    port: {
                                        type: "integer"
                                    },
                                    user: {
                                        type: "string"
                                    },
                                    password: {
                                        type: "string"
                                    },
                                    database: {
                                        type: "string"
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    },
    provides: {
        database: "db"
    },
    async init(config) {
        const db = knex({
            ...getKnexConnection(config.db),
            log: {
                debug: msg => knexLogger.debug("%s", msg),
                warn: msg => knexLogger.warn("%s", msg),
                error: msg => knexLogger.error("%s", msg)
            }
        }) as Knex;

        try {
            logger.debug("Checking that the database connection works");
            await db.raw("SELECT 1+1 AS result");
        } catch (cause) {
            throw new Error("Invalid database credentials", {cause});
        }

        await migrate(db);

        return createPlugin(db);
    }
};

export default pluginExport;
