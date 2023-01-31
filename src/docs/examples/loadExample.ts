import { readdirSync, readFileSync } from "fs";
import { codeBlockLang } from "kbts";
import { resolve } from "path";
import mkdirp from "mkdirp";
import rimraf from "rimraf";

import { packageDirectorySync } from "pkg-dir";
const pkgRoot = packageDirectorySync()!;

export async function loadExample(name: string) {
  const code = codeBlockLang("ts")(
    readFileSync(
      resolve(pkgRoot, "src/docs/examples", name + "/code.ts"),
      "utf8"
    ).replace(/\n+$/, "")
  );

  const outputPath = `src/docs/examples/${name}/output`;
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
      readFileSync(`${pwd}/${outputPath}/${file}.md`, "utf-8").replace(
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
