import { relative, resolve } from "path";
import * as ts from "typescript";

const projectRoot = resolve(__dirname, "..", "..");

namespace _ {
  export const sourceFileKey = "sourceFile";
  export const startKey = "start";
  export const endKey = "end";
  export const jsdocKey = "jsdoc";
  export const nameKey = "name";
  export const hashKey = "hash";

  export const apiFunction = "api";
  export const apiCompiledPrivateFunction = "__compiled__";
}

export default function (
  program: ts.Program,
  pluginOptions?: {
    libPath?: readonly string[];
  }
) {
  const libPath =
    pluginOptions?.libPath != null
      ? pluginOptions.libPath.map((path) => resolve(process.cwd(), path))
      : [
          resolve(projectRoot, "src", "lib", "index.ts"),
          resolve(projectRoot, "lib", "index.js"),
          resolve(projectRoot, "lib", "index.d.ts"),
        ];

  return (ctx: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      function resolveIdentifierTarget(identifier: ts.Node | null) {
        if (!identifier || !ts.isIdentifier(identifier)) return null;
        const symbol = program.getTypeChecker().getSymbolAtLocation(identifier);

        const declarations = symbol?.declarations || [];
        if (!declarations.length) return null;
        const declaration = declarations[0];
        if (!ts.isImportSpecifier(declaration)) return null;

        const importDeclaration = declaration.parent.parent.parent;
        if (
          !(
            ts.isImportDeclaration(importDeclaration) &&
            ts.isStringLiteral(importDeclaration.moduleSpecifier)
          )
        ) {
          return null;
        }

        const resolvedModule = ts.resolveModuleName(
          importDeclaration.moduleSpecifier.text,
          sourceFile.fileName,
          program.getCompilerOptions(),
          ts.sys
        ).resolvedModule;

        const sf =
          resolvedModule &&
          program.getSourceFile(resolvedModule.resolvedFileName);

        const original =
          symbol && program.getTypeChecker().getAliasedSymbol(symbol);
        return sf && original
          ? {
              module: sf,
              exportName: declaration.propertyName ?? declaration.name,
              identifier,
              original,
            }
          : null;
      }

      function replace(node: ts.Node): ts.Node | null {
        if (!ts.isCallExpression(node)) return null;

        const callee = resolveIdentifierTarget(node.expression);
        if (
          !(
            callee &&
            libPath.includes(callee.module.fileName) &&
            callee.exportName.text === _.apiFunction
          )
        ) {
          return null;
        }

        const arg0 = resolveIdentifierTarget(node.arguments[0]);
        if (!arg0) return null;

        const arg0Decl = arg0.original.getDeclarations()?.[0];
        if (!arg0Decl) return null;

        const arg0DeclTs = ts.getOriginalNode(arg0Decl);

        const jsdoc = arg0DeclTs
          .getChildren()
          .filter((node) => ts.isJSDoc(node));

        return ts.factory.createCallExpression(
          ts.factory.createPropertyAccessChain(
            ts.factory.createAsExpression(
              callee.identifier,
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            ),
            void 0,
            _.apiCompiledPrivateFunction
          ),
          void 0,
          [
            ts.factory.createObjectLiteralExpression([
              ts.factory.createPropertyAssignment(
                _.sourceFileKey,
                ts.factory.createStringLiteral(
                  "./" +
                    relative(
                      node.getSourceFile().fileName,
                      arg0DeclTs.getSourceFile().fileName
                    )
                )
              ),
              ts.factory.createPropertyAssignment(
                _.startKey,
                ts.factory.createNumericLiteral(
                  arg0DeclTs.getStart(void 0, true)
                )
              ),
              ts.factory.createPropertyAssignment(
                _.endKey,
                ts.factory.createNumericLiteral(arg0DeclTs.getEnd())
              ),
              ts.factory.createPropertyAssignment(
                _.jsdocKey,
                ts.factory.createStringLiteral(
                  [
                    ...jsdoc.map((node) => node.getFullText()),
                    printDeclaration(arg0DeclTs, program.getTypeChecker()),
                  ].join("\n")
                )
              ),
              ts.factory.createPropertyAssignment(
                _.nameKey,
                ts.factory.createStringLiteral(
                  ((ts.isClassDeclaration(arg0DeclTs) ||
                    ts.isFunctionDeclaration(arg0DeclTs) ||
                    ts.isVariableDeclaration(arg0DeclTs)) &&
                    arg0DeclTs.name?.getText()) ||
                    "declaration"
                )
              ),
              ts.factory.createPropertyAssignment(
                _.hashKey,

                ts.factory.createStringLiteral(
                  createHash("sha1")
                    .update(
                      JSON.stringify([
                        relative(
                          projectRoot,
                          arg0DeclTs.getSourceFile().fileName
                        ),
                        arg0DeclTs.getFullStart(),
                        arg0DeclTs.getEnd(),
                      ])
                    )
                    .digest("hex")
                )
              ),
            ]),
            ...node.arguments.slice(1),
          ]
        );
      }

      function visitor(node: ts.Node): ts.Node {
        return replace(node) || ts.visitEachChild(node, visitor, ctx);
      }

      return ts.visitEachChild(sourceFile, visitor, ctx);
    };
  };
}

function printDeclaration(node: ts.Node, checker: ts.TypeChecker) {
  if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) {
    return printFunctionDeclaration(node, checker);
  }

  return node.getFullText();
}

function printFunctionDeclaration(
  node: ts.FunctionDeclaration | ts.FunctionExpression,
  checker: ts.TypeChecker
) {
  const signature = checker.getSignatureFromDeclaration(node);
  if (!signature) return "";

  const referencedTypes: ts.Type[] = [];
  const typeParams = signature.getTypeParameters()?.map((typeParam) => {
    const defaultType = typeParam.getDefault();
    const extendsType = typeParam.getConstraint();
    const name = typeParam.getSymbol()?.getName() || "";

    defaultType && referencedTypes.push(defaultType);
    extendsType && referencedTypes.push(extendsType);
    return [
      name,
      extendsType ? "extends " + checker.typeToString(extendsType) : "",
      defaultType ? "= " + checker.typeToString(defaultType) : "",
    ]
      .filter(Boolean)
      .join(" ");
  });

  const params =
    signature
      ?.getParameters()
      .map((parameter) => {
        const type = checker.getTypeOfSymbolAtLocation(parameter, node);
        referencedTypes.push(type);
        return `${parameter.getName()}: ${checker.typeToString(type)}`;
      })
      ?.join(", ") || "";

  const returnType = signature.getReturnType();
  referencedTypes.push(returnType);

  const refSymbols: ts.Symbol[] = [];
  for (const type of referencedTypes) {
    for (const symbol of getSymbolsFromType(type, checker)) {
      if (symbol.name.startsWith("__")) continue;
      refSymbols.push(symbol);
    }
  }

  return prettier.format(
    `function ${node.name?.text || ""}${
      typeParams?.length ? `<${typeParams.join(", ")}>` : ""
    }(${params}): ${checker.typeToString(returnType)};

    ${
      true // switch off referenced type emits for now
        ? ""
        : refSymbols
            .map(
              (sym) =>
                "// " +
                sym.name +
                " at " +
                (sym.getDeclarations()?.[0]?.getSourceFile().fileName || "??")
            )
            .join("\n")
    }
    `,
    { parser: "typescript" }
  );
}

function* getSymbolsFromType(
  type: ts.Type,
  checker: ts.TypeChecker
): Generator<ts.Symbol> {
  if (type.isUnionOrIntersection()) {
    for (const subtype of type.types) {
      yield* getSymbolsFromType(subtype, checker);
    }
  } else {
    let symbol = type.aliasSymbol || type.getSymbol();
    if (symbol) {
      yield symbol;
      for (const arg of type.aliasTypeArguments || []) {
        yield* getSymbolsFromType(arg, checker);
      }
    }
  }
}

import { createHash } from "crypto";
import * as prettier from "prettier";
import { type } from "os";
