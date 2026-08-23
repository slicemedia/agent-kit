import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validatePluginVersion } from "./plugin-version.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(
  await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
);
const changesets = JSON.parse(
  await readFile(resolve(repositoryRoot, ".changeset/config.json"), "utf8"),
);
const plugin = JSON.parse(
  await readFile(resolve(repositoryRoot, ".codex-plugin/plugin.json"), "utf8"),
);
const errors = [];

if (manifest.name !== "@slicemedia/agent-kit") {
  errors.push(
    "Unexpected package name; versioning is restricted to Agent Kit.",
  );
}
if (
  typeof manifest.version !== "string" ||
  !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(
    manifest.version,
  )
) {
  errors.push("package.json must contain one exact semantic version.");
}
if (changesets.baseBranch !== "main" || changesets.access !== "public") {
  errors.push(
    "Changesets must target main and prepare public package metadata.",
  );
}
if ("privatePackages" in changesets) {
  errors.push(
    "Public Agent Kit versioning must not use privatePackages overrides.",
  );
}
if (
  !Array.isArray(changesets.fixed) ||
  changesets.fixed.length !== 0 ||
  !Array.isArray(changesets.linked) ||
  changesets.linked.length !== 0
) {
  errors.push("Agent Kit is a single independently versioned package.");
}
errors.push(...validatePluginVersion(manifest, plugin));

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.info(`Version metadata passed for Agent Kit ${manifest.version}.`);
}
