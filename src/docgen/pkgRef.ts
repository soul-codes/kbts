import { readFileSync } from "fs";
import { code } from "kbts";
import { resolve } from "path";
import { packageDirectorySync } from "pkg-dir";

export const pkgRoot = packageDirectorySync()!;
const packageJson = JSON.parse(
  readFileSync(resolve(pkgRoot || process.cwd(), "package.json"), "utf-8")
) as { name: string; version: string };

export const pkg = packageJson.name;
export const pkgVersion = packageJson.version;

export const pkgRef = code(pkg);

export const tsPluginRef = code(`${pkg}/api-transform`);
