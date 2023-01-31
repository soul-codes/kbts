import { customName, firstKB, linkExample } from "./examples";

import { api, d, foobar, kb, link, list, remark } from "kbts";
import { preferredFilename, render, save } from "kbts/markdown";
import rimraf from "rimraf";
import { install } from "source-map-support";
import { pkg, pkgRef } from "./pkgRef";

install();
const pwd = process.cwd();

rimraf.sync("./docs");

const readme = kb(`${pkg} - a documentation-as-code library for TypeScript`)`
  ${remark()("This package is in early development phase!")}

  ${pkgRef} (for "Knowledge Base in TypeScript") presents a
  documentation-as-code solution where units of documentation
  ("knowledge base" or "KB") are composed programmatically
  to generate documentation. The approach in principle
  allows for different presentations of KBs in various media
  (markdown, CLI, interactive web page, etc); generally, ${pkgRef}
  encourages knowledge to be authored and linked independently of how it
  is presented.

  ${() =>
    list(
      link(apiReference),
      link(kb("Getting Started")`
        ${firstKB}
        ${customName}
        ${linkExample}
`)
    )}

`;

const apiList = [
  d`Markdown APIs ${list(api(render))}`,
  d`Core API ${list(api(kb), api(preferredFilename), api(foobar))}
  `,
];

const apiReference = kb("API reference")(list(...apiList));

process.chdir(pwd);
save(
  await render([preferredFilename("README.md")(readme)], {
    paths: [
      [readme, "."],
      [null, "./docs"],
    ],
  })
);
