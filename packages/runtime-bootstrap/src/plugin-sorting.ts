import {ok as assert} from "assert";
import {OrderConstraint, OrderConstraintItem} from "@radiantpm/plugin-types";
import {PluginInfo} from "./PluginInfo";

interface PluginMapItem extends PluginInfo {
    // plugin id => constraint type
    dependencies: Map<string, ConstraintType>;
}

type PluginMap = ReadonlyMap<string, PluginMapItem>;

enum ConstraintType {
    wildcard,
    scopeWildcard,
    specific
}

interface ParsedConstraint {
    type: ConstraintType;
    isRequired: boolean;
    value: string;
    source: string;
}

function parseConstraint(constraint: OrderConstraintItem): ParsedConstraint {
    const constraintValue =
        typeof constraint === "string" ? constraint : constraint.constraint;
    const isRequired =
        typeof constraint === "string" ? false : constraint.required;

    if (constraintValue === "*") {
        return {
            type: ConstraintType.wildcard,
            isRequired,
            value: "*",
            source: constraintValue
        };
    } else if (constraintValue.endsWith("/*")) {
        return {
            type: ConstraintType.scopeWildcard,
            isRequired,
            value: constraintValue.split("/", 1)[0],
            source: constraintValue
        };
    } else {
        return {
            type: ConstraintType.specific,
            isRequired,
            value: constraintValue,
            source: constraintValue
        };
    }
}

function assertNoDuplicates(plugins: PluginInfo[]) {
    const names = new Set<string>();

    for (const pl of plugins) {
        if (names.has(pl.name))
            throw new Error(`Multiple plugins share the identifier ${pl.name}`);
        names.add(pl.name);
    }
}

export function createPluginMap(plugins: PluginInfo[]): PluginMap {
    assertNoDuplicates(plugins);

    return new Map(
        plugins.map(pl => [
            pl.name,
            {
                ...pl,
                dependencies: new Map()
            }
        ])
    );
}

function findPluginsByConstraint(
    plugins: PluginMap,
    constraint: ParsedConstraint
): PluginMapItem[] {
    if (constraint.type === ConstraintType.specific) {
        const pl = plugins.get(constraint.value);
        if (pl) return [pl];
        else return [];
    } else if (constraint.type === ConstraintType.scopeWildcard) {
        return Array.from(plugins.values()).filter(v =>
            v.name.startsWith(constraint.value + "/")
        );
    } else {
        return Array.from(plugins.values());
    }
}

function getConstraints(
    part: OrderConstraint | undefined
): OrderConstraintItem[] {
    if (!part) return [];
    if (Array.isArray(part)) return part;
    return [part];
}

/**
 * Loads the constraints of each plugin into a format that can be consumed by a topological sorting algorithm, in place
 * @param plugins Map of plugins keyed by their ID
 * @returns The `plugins` value
 */
export function buildDependencyTree(plugins: PluginMap): PluginMap {
    for (const [name, info] of Array.from(plugins.entries())) {
        for (const constraint of getConstraints(info.export.loadAfter)) {
            const parsedConstraint = parseConstraint(constraint);
            const matchingPlugins = findPluginsByConstraint(
                plugins,
                parsedConstraint
            );

            if (parsedConstraint.isRequired && matchingPlugins.length === 0) {
                throw new Error(
                    `Constraint \`${parsedConstraint.source}\` for plugin ${name} was set to require matching plugins, but none were found`
                );
            }

            for (const matchingPlugin of matchingPlugins) {
                if (matchingPlugin.name === name) {
                    if (parsedConstraint.type === ConstraintType.specific)
                        throw new Error("Plugin cannot load after itself");
                    else continue;
                }

                if (
                    info.dependencies.get(matchingPlugin.name)! >
                    parsedConstraint.type
                ) {
                    continue;
                }

                if (matchingPlugin.dependencies.has(name)) {
                    const matchingDependencyConstraintType =
                        matchingPlugin.dependencies.get(name)!;

                    if (
                        matchingDependencyConstraintType < parsedConstraint.type
                    ) {
                        // this new dependency has a more specific constraint; override the old one
                        matchingPlugin.dependencies.delete(name);
                        info.dependencies.set(
                            matchingPlugin.name,
                            parsedConstraint.type
                        );
                    }
                } else {
                    info.dependencies.set(
                        matchingPlugin.name,
                        parsedConstraint.type
                    );
                }
            }
        }

        for (const constraint of getConstraints(info.export.loadBefore)) {
            const parsedConstraint = parseConstraint(constraint);
            const matchingPlugins = findPluginsByConstraint(
                plugins,
                parsedConstraint
            );

            if (parsedConstraint.isRequired && matchingPlugins.length === 0) {
                throw new Error(
                    `Constraint \`${constraint}\` for plugin ${name} was set to require matching plugins, but none were found`
                );
            }

            for (const matchingPlugin of matchingPlugins) {
                if (matchingPlugin.name === name) {
                    if (parsedConstraint.type === ConstraintType.specific)
                        throw new Error("Plugin cannot load before itself");
                    else continue;
                }

                if (
                    matchingPlugin.dependencies.get(name)! >
                    parsedConstraint.type
                ) {
                    continue;
                }

                if (info.dependencies.has(matchingPlugin.name)) {
                    const matchingDependencyConstraintType =
                        info.dependencies.get(matchingPlugin.name)!;

                    if (
                        matchingDependencyConstraintType < parsedConstraint.type
                    ) {
                        // this new dependency has a more specific constraint; override the old one
                        info.dependencies.delete(matchingPlugin.name);
                        matchingPlugin.dependencies.set(
                            name,
                            parsedConstraint.type
                        );
                    }
                } else {
                    matchingPlugin.dependencies.set(
                        name,
                        parsedConstraint.type
                    );
                }
            }
        }
    }

    return plugins;
}

function findStartNodes(plugins: PluginMap) {
    return Array.from(plugins.values()).filter(
        pl => pl.dependencies.size === 0
    );
}

/**
 * Uses Kahn's algorithm to order the dependencies in a way that they can be loaded in an order that satisfies all dependency requirements
 * @see https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm
 * @param plugins A map of plugins, with the dependency tree already built
 * @remarks `plugins` will be modified by calling this function (removing values from `.dependencies`)
 */
export function calculateLoadOrder(plugins: PluginMap): PluginInfo[] {
    const startNodes = findStartNodes(plugins);
    const output: PluginInfo[] = [];

    const outgoingEdges = new Map<string, string[]>();

    for (const plugin of Array.from(plugins.values())) {
        for (const dependency of Array.from(plugin.dependencies.keys())) {
            let arr = outgoingEdges.get(dependency);

            if (!arr) {
                arr = [];
                outgoingEdges.set(dependency, arr);
            }

            arr.push(plugin.name);
        }
    }

    while (startNodes.length > 0) {
        const node = startNodes.pop()!;
        output.push(node);

        const edges = outgoingEdges.get(node.name) ?? [];

        while (edges.length > 0) {
            const dependencyId = edges.pop()!;
            const subNode = plugins.get(dependencyId)!;
            subNode.dependencies.delete(node.name);
            if (subNode.dependencies.size === 0) startNodes.push(subNode);
        }
    }

    assert(
        Array.from(plugins.values()).every(it => it.dependencies.size === 0),
        "Some plugins have circular dependencies with each other"
    );

    return output;
}
