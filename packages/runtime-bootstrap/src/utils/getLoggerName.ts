import {runtimeLibraryTypes} from "../runtime-libraries";

/**
 * Tries to get the best logger name for a specific package name, using the following rules:
 * - If the package name does not have a scope, just use the name
 * - If the package name (not including the scope) is `plugin` or `runtime`, use `[plugin/runtime]-[scope]`
 * - If the package name (not including the scope) is a runtime type (`runtime-[plugin-loader/backend/...]`), use `runtime-[scope]-[type]`
 * - Otherwise, use the package name (not including the scope)
 */
export default function getLoggerName(packageName: string): string {
    if (!packageName.includes("/")) return packageName;

    const [scope, pkg] = packageName.substring(1).split("/", 2);

    if (pkg === "plugin") return `plugin-${scope}`;
    if (pkg === "runtime") return `runtime-${scope}`;

    if (pkg.startsWith("runtime-")) {
        const runtimeType = pkg.substring("runtime-".length);

        if (runtimeLibraryTypes.has(runtimeType)) {
            return `runtime-${scope}-${runtimeType}`;
        }
    }

    return pkg;
}
