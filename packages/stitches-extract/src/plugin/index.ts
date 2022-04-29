import assert from "assert";
import {createHash} from "crypto";
import generateDf from "@babel/generator";
import {parse} from "@babel/parser";
import traverseDf, {NodePath} from "@babel/traverse";
import {importDeclaration, ObjectExpression, stringLiteral} from "@babel/types";
import {stringify} from "@stitches/stringify";
import {Plugin, TransformResult} from "vite";
import {name} from "~package.json";

const traverse = (traverseDf as any).default as typeof traverseDf;
const generate = (generateDf as any).default as typeof generateDf;

export default function stitchesExtract(): Plugin[] {
    const styleObjects = new Map<string, unknown>();

    function addStyleObject(name: string, value: unknown) {
        const key = `@stitches-extract-usercss__${name}.css`;
        styleObjects.set(key, value);
        return key;
    }

    function buildJsObject(path: NodePath<ObjectExpression>) {
        path.skip();

        const result: Record<string, unknown> = {};

        path.traverse({
            ObjectProperty(path) {
                path.skip();

                const keyNode = path.get("key");

                const key = keyNode.isIdentifier()
                    ? keyNode.node.name
                    : keyNode.isStringLiteral()
                    ? keyNode.node.value
                    : keyNode.isNumericLiteral()
                    ? (keyNode.node.extra!.raw as string)
                    : null;

                assert(
                    key !== null,
                    `createStitchesExtract object must only have identifiers as keys (got ${keyNode.node.type})`
                );

                const value = path.get("value");

                if (value.isStringLiteral()) {
                    result[key] = value.node.value;
                } else if (value.isNumericLiteral()) {
                    result[key] = keyNode.node.extra!.raw as string;
                } else if (value.isObjectExpression()) {
                    result[key] = buildJsObject(value);
                }
            }
        });

        return result;
    }

    function hashName(name: string) {
        const hash = createHash("sha256");
        hash.update(name);
        const result = hash.digest().toString("hex");
        return result.substring(0, 8);
    }

    function hashToken(type: string, name: string) {
        return hashName(`${type} ${name}`);
    }

    return [
        {
            name: "stitches-extract:css-file",
            resolveId(id) {
                if (styleObjects.has(id)) return "\0" + id;
                return;
            },
            load(id) {
                if (!id.startsWith("\0")) return;
                const key = id.substring(1);

                const obj = styleObjects.get(key);
                if (!obj) return;

                return stringify(obj);
            }
        },
        {
            name: "stitches-extract:config-file",
            transform(code: string): TransformResult | undefined {
                // cursory checks to ignore this file
                if (!code.includes(name)) return;
                if (!code.includes("createStitchesExtract")) return;

                const ast = parse(code, {
                    sourceType: "module"
                });

                let cseFuncName: string | undefined;

                traverse(ast, {
                    ImportDeclaration(path) {
                        const pkgName = path.get("source").node.value;
                        console.log("pkg name:", pkgName);
                        if (pkgName !== name) return;

                        path.get("source").replaceWith(
                            stringLiteral(`${name}/runtime`)
                        );

                        path.traverse({
                            ImportSpecifier(path) {
                                const importedNode = path.get("imported");

                                const imported = importedNode.isStringLiteral()
                                    ? importedNode.node.value
                                    : importedNode.isIdentifier()
                                    ? importedNode.node.name
                                    : null;

                                const local = path.get("local").node.name;

                                if (imported !== "createStitchesExtract")
                                    return;

                                console.log("cse is called", local);
                                cseFuncName = local;
                            }
                        });
                    },
                    CallExpression(path) {
                        const fnNameNode = path.get("callee");
                        if (!fnNameNode.isIdentifier()) return;

                        const fnName = fnNameNode.node.name;
                        if (fnName !== cseFuncName) return;

                        console.log("found cse call");

                        path.traverse({
                            ObjectExpression: {
                                exit(path) {
                                    if (!path.parentPath.isCallExpression())
                                        return;
                                    path.remove();
                                }
                            },
                            ObjectProperty(path) {
                                path.skip();

                                const keyNode = path.get("key");

                                const key = keyNode.isIdentifier()
                                    ? keyNode.node.name
                                    : keyNode.isStringLiteral()
                                    ? keyNode.node.value
                                    : keyNode.isNumericLiteral()
                                    ? (keyNode.node.extra!.raw as string)
                                    : null;

                                assert(
                                    key !== null,
                                    `createStitchesExtract object must only have identifiers as keys (got ${keyNode.node.type})`
                                );

                                if (key === "tokens") {
                                    const value = path.get("value");
                                    assert(value.isObjectExpression());
                                    const obj = buildJsObject(value) as Record<
                                        string,
                                        Record<string, string>
                                    >;

                                    const style =
                                        process.env.NODE_ENV === "production"
                                            ? {
                                                  ":root": Object.fromEntries(
                                                      Object.entries(
                                                          obj
                                                      ).flatMap(
                                                          ([type, tokens]) =>
                                                              Object.entries(
                                                                  tokens
                                                              ).map(
                                                                  ([
                                                                      name,
                                                                      value
                                                                  ]) => [
                                                                      `--${hashToken(
                                                                          type,
                                                                          name
                                                                      )}`,
                                                                      value
                                                                  ]
                                                              )
                                                      )
                                                  )
                                              }
                                            : {
                                                  ":root": Object.fromEntries(
                                                      Object.entries(
                                                          obj
                                                      ).flatMap(
                                                          ([type, tokens]) =>
                                                              Object.entries(
                                                                  tokens
                                                              ).map(
                                                                  ([
                                                                      name,
                                                                      value
                                                                  ]) => [
                                                                      `--${type}-${name}`,
                                                                      value
                                                                  ]
                                                              )
                                                      )
                                                  )
                                              };

                                    const cssId = addStyleObject(
                                        "cse/root",
                                        style
                                    );
                                    ast.program.body.unshift(
                                        importDeclaration(
                                            [],
                                            stringLiteral(cssId)
                                        )
                                    );
                                } else {
                                    console.error(
                                        "Unsupported createStitchesExtract options key:",
                                        key
                                    );
                                }
                            }
                        });
                    }
                });

                return {
                    code: generate(ast).code,
                    map: null
                };
            }
        }
    ];
}
