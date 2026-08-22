import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { synchronizePluginVersion } from "./plugin-version.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = await synchronizePluginVersion(
  resolve(repositoryRoot, "package.json"),
  resolve(repositoryRoot, ".codex-plugin/plugin.json"),
);

console.info(`Synchronized Codex plugin manifest to Agent Kit ${version}.`);
