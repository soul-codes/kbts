import { readFileSync, readdirSync } from "fs";
import { resolve } from "path";

import mkdirp from "mkdirp";
import { packageDirectorySync } from "pkg-dir";
import rimraf from "rimraf";
import { install } from "source-map-support";

import { code, codeBlockLang, d, kb, link } from "../lib/index.js";
import { defaultFilename, render, save } from "../lib/markdown/index.js";

install();
const pwd = process.cwd();

const pkgRoot = packageDirectorySync()!;
const pkg = (
  JSON.parse(
    readFileSync(resolve(pkgRoot || process.cwd(), "package.json"), "utf-8")
  ) as { name: string }
).name;

const pkgRef = code(pkg);

const readme = kb(`${pkg} - a documentation-as-code library for TypeScript`)`
  ${pkgRef} (for "Knowledge Base in TypeScript") presents a
  documentation-as-code solution where units of documentation
  ("knowledge base" or "KB") are composed programmatically
  to generate documentation. The approach in principle
  allows for different presentations of KBs in various media
  (markdown, CLI, interactive web page, etc); generally, ${pkgRef}
  encourages knowledge to be authored and linked independently of how it
  is presented.

  ${kb("Getting Started")`
    ${() => firstKB}
    ${() => customName}
    ${() => linkExample}
  `}
`;

const firstKB = await (async () => {
  const example = await loadExample("ex1");

  return kb("Rendering a simple KB as markdown")(() => {
    return d`
  A KB is a document with a title and a content. This example creates a simple README
  KB with a simple text content.

  ${example.code}

  In order to generate a documentation, a set of KBs must be sent to a renderer.
  Here we use the markdown renderer.

  Result:
  ${example.result("My_Documentation")}
  `;
  });
})();

const customName = await (async () => {
  const example = await loadExample("ex2");

  return kb("Custom Output Naming")(() => {
    return d`
  The markdown renderer emits one file per KB, named by its title.

  ${example.code}

  This produces the following output:
  ${example.fileTree}

  Examining ${code(`README.md`)} gives:
  ${example.result("README")}

  `;
  });
})();

const linkExample = await (async () => {
  const example = await loadExample("ex3");

  return kb("Links to other KBs")(() => {
    return d`
  A KB can link to other KBs using the ${code(link.name)} function.
  With the markdown renderer, this causes the resulting markdowns to
  also be linked. For instance:

  ${example.code}

  This produces the following output:
  ${example.fileTree}

  Examining ${code(`Page_A.md`)} gives:
  ${example.result("Page_A")}

  Examining ${code(`Page_B.md`)} gives:
  ${example.result("Page_B")}

  Importantly, note that in the code, only Page A was given to the
  renderer, but Page B was also resolved and outputted. ${pkgRef} will resolve
  KB dependencies and emit all needed documents. You now have symbolic referential
  guarantee for your documentation thanks to the knowledge base being
  composed in TypeScript; no broken links!.

  `;
  });
})();

// const apiReference = series("API reference", [
//   kb.kb,
//   block.kb,
//   d.kb,
//   list.kb,
//   inline.kb,
// ]);

// save(
//   render([example], {
//     paths: new Map([[example, "./docs"]]),
//   })
// );

process.chdir(pwd);
save(
  render([defaultFilename("README.md")(readme)], {
    paths: new Map([[firstKB, "./docs"]]),
  })
);

async function loadExample(name: string) {
  const code = codeBlockLang("ts")(
    readFileSync(
      resolve(pkgRoot, "src/examples", name + "/code.ts"),
      "utf8"
    ).replace(/\n+$/, "")
  );

  const outputPath = `src/examples/${name}/output`;
  rimraf.sync(outputPath);

  const pwd = process.cwd();
  mkdirp.sync(outputPath);
  process.chdir(outputPath);
  await import(`../examples/${name}/code.js`);
  process.chdir(pwd);

  const result = (file: string) =>
    codeBlockLang("md")(
      readFileSync(`${outputPath}/${file}.md`, "utf-8").replace(/\n+$/, "")
    );

  const fileTree = codeBlockLang("md")(
    readdirSync(outputPath)
      .map((file) => "- " + file)
      .join("\n")
  );

  return { code, result, fileTree };
}
