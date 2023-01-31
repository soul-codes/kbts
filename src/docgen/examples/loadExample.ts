import { readdirSync, readFileSync } from "fs";
import { codeBlockLang } from "kbts";
import mkdirp from "mkdirp";
import { dirname, join, relative, resolve } from "path";
import rimraf from "rimraf";

import { packageDirectorySync } from "pkg-dir";
import { fileURLToPath } from "url";

const pkgRoot = packageDirectorySync()!;
const thisDir = resolve(
  pkgRoot,
  "src",
  relative(join(pkgRoot, "target"), dirname(fileURLToPath(import.meta.url)))
);

export async function loadExample(name: string) {
  const code = codeBlockLang("ts")(
    readFileSync(resolve(thisDir, name, "code.ts"), "utf8").replace(/\n+$/, "")
  );

  const outputPath = resolve(thisDir, name, "output");
  rimraf.sync(outputPath);

  const pwd = process.cwd();
  mkdirp.sync(outputPath);
  await sequential(async () => {
    process.chdir(outputPath);
    await import(`./${name}/code.js`);
    process.chdir(pwd);
  });

  const result = (file: string) =>
    codeBlockLang("md")(
      readFileSync(resolve(outputPath, file + ".md"), "utf-8").replace(
        /\n+$/,
        ""
      )
    );

  const fileTree = codeBlockLang("md")(
    readdirSync(outputPath)
      .map((file) => "- " + file)
      .join("\n")
  );

  return { code, result, fileTree };
}

const sequential = (() => {
  let promiseLast = Promise.resolve();
  return (task: () => Promise<void>) => (promiseLast = promiseLast.then(task));
})();
