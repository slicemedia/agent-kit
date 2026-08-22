import { readFile, writeFile } from "node:fs/promises";

const SEMVER_PATTERN =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

export function validatePluginVersion(packageManifest, pluginManifest) {
  const errors = [];
  if (
    typeof packageManifest.version !== "string" ||
    !SEMVER_PATTERN.test(packageManifest.version)
  ) {
    errors.push("package.json must contain one exact semantic version.");
  }
  if (
    typeof pluginManifest.version !== "string" ||
    !SEMVER_PATTERN.test(pluginManifest.version)
  ) {
    errors.push(
      ".codex-plugin/plugin.json must contain one exact semantic version.",
    );
  }
  if (
    errors.length === 0 &&
    packageManifest.version !== pluginManifest.version
  ) {
    errors.push(
      ".codex-plugin/plugin.json version must exactly match package.json.",
    );
  }
  return errors;
}

export async function synchronizePluginVersion(packagePath, pluginPath) {
  const packageManifest = JSON.parse(await readFile(packagePath, "utf8"));
  const pluginManifest = JSON.parse(await readFile(pluginPath, "utf8"));
  if (
    typeof packageManifest.version !== "string" ||
    !SEMVER_PATTERN.test(packageManifest.version)
  ) {
    throw new Error("package.json must contain one exact semantic version.");
  }
  pluginManifest.version = packageManifest.version;
  await writeFile(pluginPath, `${JSON.stringify(pluginManifest, null, 2)}\n`);
  return packageManifest.version;
}
