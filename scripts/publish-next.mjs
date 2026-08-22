import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execute = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = "https://registry.npmjs.org/";
const releaseDirectoryName = "slicemedia-agent-kit-next";
const archiveName = "agent-kit.tgz";
const npmCliArchiveName = "npm-cli.tgz";
const receiptName = "candidate.json";
const userConfigName = "empty-user.npmrc";
const npmCliVersion = "11.19.0";
const npmCliIntegrity =
  "sha512-SDd/hHg3KqHE5Ht2NHWxNYNtqCQ2pXAPLl6OtQhPyED5PHsRfrOtO199MZTIG2cQoQ1ZRI9t28shrD+2cr3AAw==";
const maximumArchiveBytes = 32 * 1024 * 1024;
const maximumArchiveEntries = 4096;
const maximumReceiptBytes = 16 * 1024;

function prohibitedEnvironmentKey(key) {
  const normalized = key.toUpperCase();
  return (
    normalized === "NODE_AUTH_TOKEN" ||
    normalized === "NPM_TOKEN" ||
    normalized === "YARN_NPM_AUTH_TOKEN" ||
    normalized === "NPM_CONFIG_REGISTRY" ||
    normalized === "NPM_CONFIG_USERCONFIG" ||
    normalized === "PNPM_CONFIG_REGISTRY" ||
    normalized === "YARN_NPM_REGISTRY_SERVER" ||
    normalized === "COREPACK_NPM_REGISTRY" ||
    normalized === "SLICEMEDIA_FORBIDDEN_TERMS" ||
    normalized === "SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS" ||
    (/^NPM_CONFIG_/u.test(normalized) && /AUTH|TOKEN/u.test(normalized))
  );
}

function npmEnvironment(userConfig) {
  const environment = { ...process.env };
  for (const key of Object.keys(environment)) {
    if (prohibitedEnvironmentKey(key)) delete environment[key];
  }
  environment.NPM_CONFIG_USERCONFIG = userConfig;
  return environment;
}

async function run(command, arguments_, options = {}) {
  return execute(command, arguments_, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: options.encoding === "buffer" ? null : "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: options.env ?? process.env,
  });
}

async function npmRun(arguments_, userConfig, options = {}) {
  return run(
    "npm",
    [...arguments_, `--registry=${registry}`, `--userconfig=${userConfig}`],
    {
      ...options,
      env: npmEnvironment(userConfig),
    },
  );
}

async function npmView(specification, field, userConfig, directory) {
  try {
    const { stdout } = await npmRun(
      ["view", specification, field, "--json"],
      userConfig,
      { cwd: directory },
    );
    return JSON.parse(stdout);
  } catch (error) {
    const stderr = typeof error?.stderr === "string" ? error.stderr : "";
    if (/\bE404\b|is not in this registry/u.test(stderr)) return undefined;
    throw error;
  }
}

export async function archiveIntegrity(archive) {
  return `sha512-${createHash("sha512")
    .update(await readFile(archive))
    .digest("base64")}`;
}

export async function archiveTreeDigest(archive) {
  const { stdout } = await run("tar", ["-tf", archive]);
  const entries = stdout
    .split(/\r?\n/u)
    .filter((entry) => entry !== "" && !entry.endsWith("/"))
    .sort();
  if (entries.length === 0 || entries.length > maximumArchiveEntries) {
    throw new Error("Package archive contains an unexpected number of files.");
  }

  const hash = createHash("sha256");
  for (const entry of entries) {
    if (
      !entry.startsWith("package/") ||
      entry.includes("../") ||
      entry.includes("\\") ||
      entry.length > 512
    ) {
      throw new Error(`Unexpected package archive entry: ${entry}`);
    }
    const { stdout: contents } = await run("tar", ["-xOf", archive, entry], {
      encoding: "buffer",
    });
    hash.update(entry);
    hash.update("\0");
    hash.update(contents);
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function assertPrivateDirectory(directory, expectedParent) {
  const entry = await lstat(directory);
  const canonical = await realpath(directory);
  if (
    !entry.isDirectory() ||
    entry.isSymbolicLink() ||
    dirname(canonical) !== expectedParent ||
    basename(canonical) !== releaseDirectoryName ||
    (entry.mode & 0o077) !== 0 ||
    (typeof process.getuid === "function" && entry.uid !== process.getuid())
  ) {
    throw new Error(
      "Release directory failed its ownership and privacy checks.",
    );
  }
  return canonical;
}

async function requestedReleaseDirectory(create) {
  const runnerTemporary = process.env.RUNNER_TEMP;
  const requested = process.env.SLICEMEDIA_RELEASE_DIRECTORY;
  if (!runnerTemporary || !requested) {
    throw new Error(
      "Publication requires the reviewed GitHub runner temporary path.",
    );
  }
  const parent = await realpath(runnerTemporary);
  const expected = join(parent, releaseDirectoryName);
  if (resolve(requested) !== expected) {
    throw new Error(
      "Release directory does not match the reviewed runner path.",
    );
  }
  if (create) {
    let created = false;
    try {
      await mkdir(expected, { mode: 0o700 });
      created = true;
      await chmod(expected, 0o700);
    } catch (error) {
      if (created) {
        await rm(expected, { recursive: true, force: true }).catch(
          () => undefined,
        );
      }
      throw error;
    }
  }
  return assertPrivateDirectory(expected, parent);
}

async function assertSafeFile(path, directory, maximumBytes, label) {
  const before = await lstat(path);
  if (
    !before.isFile() ||
    before.isSymbolicLink() ||
    before.nlink !== 1 ||
    before.size <= 0 ||
    before.size > maximumBytes
  ) {
    throw new Error(`${label} failed its file and size constraints.`);
  }
  if (dirname(await realpath(path)) !== directory) {
    throw new Error(`${label} escaped its private directory.`);
  }
  return before;
}

async function assertSafeArchive(
  archive,
  directory,
  label = "Package archive",
) {
  await assertSafeFile(archive, directory, maximumArchiveBytes, label);
  await chmod(archive, 0o600);
}

async function createEmptyUserConfig(directory) {
  const path = join(directory, userConfigName);
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
  const entry = await lstat(path);
  if (!entry.isFile() || entry.isSymbolicLink() || entry.nlink !== 1) {
    throw new Error("npm user configuration is unsafe.");
  }
  return path;
}

async function readArchiveManifest(archive) {
  const { stdout } = await run("tar", [
    "-xOf",
    archive,
    "package/package.json",
  ]);
  return JSON.parse(stdout);
}

function assertPackedManifest(manifest, sourceVersion) {
  if (
    manifest.name !== "@slicemedia/agent-kit" ||
    manifest.version !== sourceVersion ||
    manifest.private !== false ||
    manifest.publishConfig?.access !== "public" ||
    manifest.publishConfig?.provenance !== true
  ) {
    throw new Error(
      "Packed Agent Kit identity or publication metadata changed.",
    );
  }
}

async function movePackedArchive(stdout, directory, destination, label) {
  const result = JSON.parse(stdout);
  const filename = result?.[0]?.filename;
  if (typeof filename !== "string" || filename !== basename(filename)) {
    throw new Error(`npm pack returned an unsafe ${label} path.`);
  }
  const generated = resolve(directory, filename);
  await assertSafeArchive(generated, directory, label);
  if (generated !== destination) {
    const existing = await lstat(destination).catch((error) => {
      if (error?.code === "ENOENT") return undefined;
      throw error;
    });
    if (existing) throw new Error(`${label} destination already exists.`);
    await rename(generated, destination);
  }
  await assertSafeArchive(destination, directory, label);
}

async function writeReceipt(directory, receipt) {
  const path = join(directory, receiptName);
  const source = `${JSON.stringify(receipt, null, 2)}\n`;
  const handle = await open(path, "wx", 0o600);
  try {
    await handle.writeFile(source, { encoding: "utf8" });
    await handle.sync();
  } finally {
    await handle.close();
  }
  await assertSafeFile(
    path,
    directory,
    maximumReceiptBytes,
    "Candidate receipt",
  );
}

async function readReceipt(directory) {
  const path = join(directory, receiptName);
  const before = await assertSafeFile(
    path,
    directory,
    maximumReceiptBytes,
    "Candidate receipt",
  );
  const source = await readFile(path, "utf8");
  const after = await lstat(path);
  if (
    before.dev !== after.dev ||
    before.ino !== after.ino ||
    before.size !== after.size ||
    before.mtimeMs !== after.mtimeMs
  ) {
    throw new Error("Candidate receipt changed while it was read.");
  }
  const receipt = JSON.parse(source);
  const keys = Object.keys(receipt).sort();
  const expectedKeys = [
    "archive",
    "commit",
    "integrity",
    "name",
    "npmCliArchive",
    "npmCliIntegrity",
    "schemaVersion",
    "treeDigest",
    "version",
  ].sort();
  if (
    JSON.stringify(keys) !== JSON.stringify(expectedKeys) ||
    receipt.schemaVersion !== 2 ||
    receipt.archive !== archiveName ||
    receipt.npmCliArchive !== npmCliArchiveName ||
    receipt.npmCliIntegrity !== npmCliIntegrity ||
    receipt.name !== "@slicemedia/agent-kit" ||
    !/^[0-9a-f]{40}$/u.test(receipt.commit) ||
    !/^sha512-[A-Za-z0-9+/]+={0,2}$/u.test(receipt.integrity) ||
    !/^[0-9a-f]{64}$/u.test(receipt.treeDigest) ||
    !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(
      receipt.version,
    )
  ) {
    throw new Error("Candidate receipt does not match its reviewed schema.");
  }
  return receipt;
}

async function waitForRegistryPackage(
  name,
  version,
  expectedIntegrity,
  userConfig,
  directory,
) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    if (
      (await npmView(
        `${name}@${version}`,
        "version",
        userConfig,
        directory,
      )) === version &&
      (await npmView(
        `${name}@${version}`,
        "dist.integrity",
        userConfig,
        directory,
      )) === expectedIntegrity
    ) {
      return;
    }
    if (attempt < 12) await delay(5_000);
  }
  throw new Error(
    `${name}@${version} did not become readable with the approved integrity.`,
  );
}

async function downloadRegistryArchive(
  releaseDirectory,
  name,
  version,
  userConfig,
) {
  const directory = join(releaseDirectory, "registry");
  await mkdir(directory, { mode: 0o700 });
  await chmod(directory, 0o700);
  const canonicalDirectory = await realpath(directory);
  if (dirname(canonicalDirectory) !== releaseDirectory) {
    throw new Error(
      "Registry archive directory escaped the release directory.",
    );
  }
  const { stdout } = await npmRun(
    [
      "pack",
      `${name}@${version}`,
      "--ignore-scripts",
      "--pack-destination",
      canonicalDirectory,
      "--json",
    ],
    userConfig,
    { cwd: canonicalDirectory },
  );
  const result = JSON.parse(stdout);
  const filename = result?.[0]?.filename;
  if (typeof filename !== "string" || filename !== basename(filename)) {
    throw new Error("npm pack returned an unsafe registry archive path.");
  }
  const archive = resolve(canonicalDirectory, filename);
  await assertSafeArchive(archive, canonicalDirectory, "Registry archive");
  return archive;
}

async function assertPrepareSafe() {
  const { assertPublishNextSafe } =
    await import("./assert-publish-next-safe.mjs");
  await assertPublishNextSafe();
}

export async function packNextCandidate() {
  await assertPrepareSafe();
  const directory = await requestedReleaseDirectory(true);
  try {
    const userConfig = await createEmptyUserConfig(directory);
    const { stdout: packageOutput } = await npmRun(
      [
        "pack",
        repositoryRoot,
        "--ignore-scripts",
        "--pack-destination",
        directory,
        "--json",
      ],
      userConfig,
      { cwd: directory },
    );
    const archive = join(directory, archiveName);
    await movePackedArchive(
      packageOutput,
      directory,
      archive,
      "Package archive",
    );

    const { stdout: npmOutput } = await npmRun(
      [
        "pack",
        `npm@${npmCliVersion}`,
        "--ignore-scripts",
        "--pack-destination",
        directory,
        "--json",
      ],
      userConfig,
      { cwd: directory },
    );
    const npmArchive = join(directory, npmCliArchiveName);
    await movePackedArchive(
      npmOutput,
      directory,
      npmArchive,
      "npm CLI archive",
    );
    if ((await archiveIntegrity(npmArchive)) !== npmCliIntegrity) {
      throw new Error("The npm CLI archive does not match the reviewed bytes.");
    }
    const npmManifest = await readArchiveManifest(npmArchive);
    if (npmManifest.name !== "npm" || npmManifest.version !== npmCliVersion) {
      throw new Error("The npm CLI archive has unexpected package metadata.");
    }

    const sourceManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
    );
    const packedManifest = await readArchiveManifest(archive);
    assertPackedManifest(packedManifest, sourceManifest.version);
    const receipt = {
      schemaVersion: 2,
      commit: process.env.SLICEMEDIA_RELEASE_COMMIT,
      name: packedManifest.name,
      version: packedManifest.version,
      archive: archiveName,
      integrity: await archiveIntegrity(archive),
      treeDigest: await archiveTreeDigest(archive),
      npmCliArchive: npmCliArchiveName,
      npmCliIntegrity,
    };
    await rm(userConfig);
    await writeReceipt(directory, receipt);
    console.info(
      `Prepared ${receipt.name}@${receipt.version} for approved commit ${receipt.commit}.`,
    );
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

function assertVerificationEnvironment() {
  const environment = process.env;
  if (
    environment.GITHUB_ACTIONS !== "true" ||
    environment.GITHUB_REPOSITORY !== "slicemedia/agent-kit" ||
    environment.GITHUB_REPOSITORY_VISIBILITY !== "public" ||
    environment.GITHUB_EVENT_NAME !== "workflow_dispatch" ||
    environment.GITHUB_REF !== "refs/heads/main" ||
    environment.SLICEMEDIA_RELEASE_COMMIT !== environment.GITHUB_SHA ||
    !/^[0-9a-f]{40}$/u.test(environment.SLICEMEDIA_RELEASE_COMMIT ?? "")
  ) {
    throw new Error(
      "Registry verification requires the reviewed workflow run.",
    );
  }
  if (
    environment.ACTIONS_ID_TOKEN_REQUEST_URL ||
    environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  ) {
    throw new Error("Registry verification must not receive OIDC capability.");
  }
  for (const [key, value] of Object.entries(environment)) {
    if (
      typeof value === "string" &&
      value.trim() &&
      prohibitedEnvironmentKey(key)
    ) {
      throw new Error("Registry verification received a prohibited override.");
    }
  }
}

export async function verifyNextCandidate() {
  assertVerificationEnvironment();
  const npmVersion = (await run("npm", ["--version"])).stdout.trim();
  if (npmVersion !== npmCliVersion) {
    throw new Error(`Registry verification requires npm ${npmCliVersion}.`);
  }
  const directory = await requestedReleaseDirectory(false);
  try {
    const initialFiles = (await readdir(directory)).sort();
    if (
      JSON.stringify(initialFiles) !==
      JSON.stringify([archiveName, npmCliArchiveName, receiptName].sort())
    ) {
      throw new Error("Candidate artifact contains unexpected files.");
    }
    const receipt = await readReceipt(directory);
    if (receipt.commit !== process.env.SLICEMEDIA_RELEASE_COMMIT) {
      throw new Error("Candidate receipt belongs to another release commit.");
    }
    const archive = join(directory, receipt.archive);
    const npmArchive = join(directory, receipt.npmCliArchive);
    await assertSafeArchive(archive, directory);
    await assertSafeArchive(npmArchive, directory, "npm CLI archive");
    if (
      (await archiveIntegrity(archive)) !== receipt.integrity ||
      (await archiveTreeDigest(archive)) !== receipt.treeDigest ||
      (await archiveIntegrity(npmArchive)) !== npmCliIntegrity
    ) {
      throw new Error("Prepared release artifact failed integrity validation.");
    }
    assertPackedManifest(await readArchiveManifest(archive), receipt.version);
    const userConfig = await createEmptyUserConfig(directory);

    await waitForRegistryPackage(
      receipt.name,
      receipt.version,
      receipt.integrity,
      userConfig,
      directory,
    );
    const registryArchive = await downloadRegistryArchive(
      directory,
      receipt.name,
      receipt.version,
      userConfig,
    );
    if ((await archiveIntegrity(registryArchive)) !== receipt.integrity) {
      throw new Error(
        `${receipt.name}@${receipt.version} did not download as the approved archive bytes.`,
      );
    }
    if ((await archiveTreeDigest(registryArchive)) !== receipt.treeDigest) {
      throw new Error(
        `${receipt.name}@${receipt.version} does not contain the approved archive tree.`,
      );
    }
    if (
      (await npmView(
        `${receipt.name}@next`,
        "version",
        userConfig,
        directory,
      )) !== receipt.version
    ) {
      throw new Error(
        `${receipt.name}'s npm next tag does not point to ${receipt.version}.`,
      );
    }
    console.info(
      `Verified ${receipt.name}@${receipt.version} from npm without publication capability.`,
    );
  } finally {
    await rm(directory, {
      recursive: true,
      force: true,
      maxRetries: 3,
      retryDelay: 100,
    });
  }
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isEntrypoint) {
  const operation = process.argv[2];
  if (operation === "pack") await packNextCandidate();
  else if (operation === "verify") await verifyNextCandidate();
  else throw new Error("Expected the reviewed prepare or verify operation.");
}
