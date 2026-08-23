import { execFile, spawn } from "node:child_process";
import { rmSync } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  ADAPTER_TARGETS,
  generateAdapters,
  validateAdapters,
} from "../dist/index.js";
import { validatePluginVersion } from "./plugin-version.mjs";

const run = promisify(execFile);
const cliEntrypoint = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
const temporaryFixtures = new Set();

async function temporaryFixture(prefix) {
  const fixture = await mkdtemp(join(tmpdir(), prefix));
  temporaryFixtures.add(fixture);
  return fixture;
}

process.once("exit", () => {
  for (const fixture of temporaryFixtures) {
    rmSync(fixture, { recursive: true, force: true });
  }
});

async function runCliWithInput(arguments_, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliEntrypoint, ...arguments_], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.once("error", reject);
    child.once("close", (code) => {
      const result = {
        code,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      };
      if (code === 0) resolve(result);
      else reject(Object.assign(new Error("CLI command failed"), result));
    });
    child.stdin.end(input);
  });
}

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const plugin = JSON.parse(
  await readFile(
    new URL("../.codex-plugin/plugin.json", import.meta.url),
    "utf8",
  ),
);

if (packageJson.name !== "@slicemedia/agent-kit")
  throw new Error("Unexpected package name");
if (packageJson.private !== false) {
  throw new Error(
    "Agent Kit must explicitly declare private=false for publication",
  );
}
if (packageJson.engines?.node !== ">=22.13 <23 || >=24 <25") {
  throw new Error(
    "Agent Kit must support Node 22.13+ and the maintained Node 24 line",
  );
}
if (packageJson.packageManager !== "pnpm@11.21.0") {
  throw new Error("Agent Kit release tooling must pin pnpm 11.21.0");
}
if (Object.keys(packageJson.dependencies ?? {}).join(",") !== "fflate") {
  throw new Error(
    "Agent Kit must not depend on DevKit or optional integration products",
  );
}
if (packageJson.bin?.["slicemedia-agent-kit"] !== "./dist/bin.js") {
  throw new Error("Missing slicemedia-agent-kit binary");
}
for (const required of [
  ".codex-plugin",
  "content",
  "dist",
  "skills",
  "CHANGELOG.md",
  "LICENSE",
  "README.md",
]) {
  if (!packageJson.files?.includes(required))
    throw new Error(`Package allowlist omits ${required}`);
}
if (plugin.name !== "agent-kit" || plugin.skills !== "./skills/") {
  throw new Error("Invalid Codex plugin manifest");
}
const pluginVersionErrors = validatePluginVersion(packageJson, plugin);
if (pluginVersionErrors.length > 0) {
  throw new Error(pluginVersionErrors.join("\n"));
}
if (
  plugin.author?.name !== "Slice Media" ||
  plugin.interface?.developerName !== "Slice Media"
) {
  throw new Error("Invalid plugin brand metadata");
}
if ("mcpServers" in plugin || "apps" in plugin) {
  throw new Error(
    "The skills-only plugin must not bundle an MCP server or app",
  );
}

const fixture = await temporaryFixture("slicemedia-agent-kit-package-");
await mkdir(join(fixture, "src"), { recursive: true });
await writeFile(join(fixture, "src", "main.ts"), "export {};\n");
await writeFile(join(fixture, "package.json"), "{}\n");
await writeFile(join(fixture, "vite.config.ts"), "export default {};\n");
const manifest = await generateAdapters(fixture, {
  profile: "project",
  targets: ADAPTER_TARGETS,
});
if (manifest.adapters.length !== ADAPTER_TARGETS.length) {
  throw new Error("Not every adapter target was generated");
}
const validation = await validateAdapters(fixture);
if (!validation.ok) throw new Error(validation.errors.join("\n"));

const cliFixture = await temporaryFixture("slicemedia-agent-kit-cli-");
await mkdir(join(cliFixture, "src"), { recursive: true });
await writeFile(join(cliFixture, "src", "main.ts"), "export {};\n");
await writeFile(join(cliFixture, "package.json"), "{}\n");
const { stdout } = await run(
  process.execPath,
  [
    cliEntrypoint,
    "generate",
    "--root",
    cliFixture,
    "--profile",
    "project",
    "--targets",
    "codex",
    "--targets",
    "claude",
    "--json",
  ],
  { encoding: "utf8" },
);
const cliManifest = JSON.parse(stdout);
if (cliManifest.adapters.join(",") !== "codex,claude") {
  throw new Error(
    "CLI target parsing did not preserve the selected adapter subset",
  );
}

const privateLanguageMarker = "tlh";
const profileInput = JSON.stringify({
  schemaVersion: 1,
  preferredLanguage: privateLanguageMarker,
  webDevelopmentLevel: "working",
  webflowLevel: "advanced",
  typescriptToolingLevel: "new",
  explanationDepth: "balanced",
  collaborationStyle: "collaborative",
});
const profileSave = await runCliWithInput(
  ["profile", "save", "--root", cliFixture, "--stdin", "--json"],
  profileInput,
);
const profileSaveReceipt = JSON.parse(profileSave.stdout);
if (
  profileSaveReceipt.action !== "created" ||
  profileSaveReceipt.ignoreRuleAdded !== true ||
  profileSave.stdout.includes(privateLanguageMarker) ||
  profileSave.stderr.includes(privateLanguageMarker)
) {
  throw new Error(
    "Profile save CLI leaked values or returned an invalid receipt",
  );
}

const profileStatus = await runCliWithInput(
  ["profile", "status", "--root", cliFixture, "--json"],
  "",
);
const profileStatusReceipt = JSON.parse(profileStatus.stdout);
if (
  profileStatusReceipt.supportedSchema?.schemaVersion !== 1 ||
  !profileStatusReceipt.supportedSchema?.required?.includes(
    "typescriptToolingLevel",
  ) ||
  !profileStatusReceipt.supportedSchema?.properties?.webDevelopmentLevel?.enum?.includes(
    "working",
  ) ||
  profileStatusReceipt.valid !== true ||
  profileStatus.stdout.includes(privateLanguageMarker)
) {
  throw new Error(
    "Profile status CLI omitted its schema or leaked profile values",
  );
}

const profileDelete = await runCliWithInput(
  ["profile", "delete", "--root", cliFixture, "--yes", "--json"],
  "",
);
if (
  JSON.parse(profileDelete.stdout).action !== "deleted" ||
  profileDelete.stdout.includes(privateLanguageMarker)
) {
  throw new Error(
    "Profile delete CLI leaked values or returned an invalid receipt",
  );
}

const invalidJsonMarker = "private-invalid-json-marker";
try {
  await runCliWithInput(
    ["profile", "save", "--root", cliFixture, "--stdin", "--json"],
    `{${invalidJsonMarker}`,
  );
  throw new Error("Profile save CLI unexpectedly accepted invalid JSON");
} catch (error) {
  if (error.message === "Profile save CLI unexpectedly accepted invalid JSON") {
    throw error;
  }
  const failure = JSON.parse(String(error.stderr ?? ""));
  if (
    failure.ok !== false ||
    !failure.error.includes("valid JSON") ||
    String(error.stderr ?? "").includes(invalidJsonMarker)
  ) {
    throw new Error(
      "Profile save CLI leaked invalid stdin or returned an invalid error",
      { cause: error },
    );
  }
}

async function expectCliFailure(
  arguments_,
  expectedMessage,
  forbiddenOutput = undefined,
) {
  try {
    await run(process.execPath, [cliEntrypoint, ...arguments_, "--json"], {
      encoding: "utf8",
    });
  } catch (error) {
    const receipt = JSON.parse(String(error.stderr ?? ""));
    if (
      receipt.ok !== false ||
      !receipt.error.includes(expectedMessage) ||
      (forbiddenOutput && String(error.stderr ?? "").includes(forbiddenOutput))
    ) {
      throw new Error(
        `Unexpected CLI failure receipt: ${String(error.stderr ?? "")}`,
        { cause: error },
      );
    }
    return;
  }
  throw new Error(
    `CLI unexpectedly accepted invalid arguments: ${arguments_.join(" ")}`,
  );
}

await expectCliFailure(
  ["generate", "--root", cliFixture, "--target", "codex"],
  "Unknown option: --target",
);
await expectCliFailure(
  ["generate", "--root", cliFixture],
  "requires explicit --targets",
);
await expectCliFailure(
  ["targets", "unexpected"],
  "Unexpected positional argument",
);
await expectCliFailure(
  ["profile", "save", "--root", cliFixture],
  "requires --stdin",
);
await expectCliFailure(
  ["profile", "delete", "--root", cliFixture],
  "requires --yes",
);
const positionalMarker = "private-positional-marker";
await expectCliFailure(
  ["profile", "status", positionalMarker, "--root", cliFixture],
  "Unexpected positional argument for profile command",
  positionalMarker,
);
await expectCliFailure(
  ["profile", positionalMarker, "--root", cliFixture],
  "Unsupported profile action",
  positionalMarker,
);

console.info(
  `Validated package metadata, Codex plugin, CLI, ${validation.checkedSkills} skills, and all adapter targets.`,
);
