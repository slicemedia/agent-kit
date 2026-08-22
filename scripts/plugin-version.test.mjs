import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  synchronizePluginVersion,
  validatePluginVersion,
} from "./plugin-version.mjs";

describe("Codex plugin version", () => {
  it("requires the plugin and package versions to match exactly", () => {
    expect(
      validatePluginVersion({ version: "0.2.0" }, { version: "0.1.0" }),
    ).toEqual([
      ".codex-plugin/plugin.json version must exactly match package.json.",
    ]);
    expect(
      validatePluginVersion({ version: "0.2.0" }, { version: "0.2.0" }),
    ).toEqual([]);
  });

  it.each(["latest", "^0.2.0", "0.2", "v0.2.0"])(
    "rejects an invalid plugin version %s",
    (version) => {
      expect(
        validatePluginVersion({ version: "0.2.0" }, { version }),
      ).not.toEqual([]);
    },
  );

  it("synchronizes the packaged plugin after Changesets bumps the package", async () => {
    const fixture = await mkdtemp(join(tmpdir(), "agent-kit-plugin-version-"));
    try {
      const pluginDirectory = join(fixture, ".codex-plugin");
      await mkdir(pluginDirectory);
      const packagePath = join(fixture, "package.json");
      const pluginPath = join(pluginDirectory, "plugin.json");
      await writeFile(packagePath, '{"version":"0.2.0"}\n');
      await writeFile(pluginPath, '{"name":"agent-kit","version":"0.1.0"}\n');

      await expect(
        synchronizePluginVersion(packagePath, pluginPath),
      ).resolves.toBe("0.2.0");
      const plugin = JSON.parse(await readFile(pluginPath, "utf8"));
      expect(plugin).toEqual({ name: "agent-kit", version: "0.2.0" });
    } finally {
      await rm(fixture, { force: true, recursive: true });
    }
  });
});
