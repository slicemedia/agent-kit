import { createHash } from "node:crypto";
import {
  mkdir,
  readdir,
  readFile,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { strToU8, zipSync } from "fflate";

import { USER_PROFILE_RELATIVE_PATH } from "./user-profile.js";

export interface AgentKitPaths {
  packageRoot: string;
  repoRoot: string;
  contentRoot: string;
  skillsRoot: string;
  generatedRoot: string;
}

export interface SkillMetadata {
  name: string;
  description: string;
  directory: string;
  surfaces: SkillSurface[];
  distribution: SkillDistribution;
}

export type SkillDistribution = "all" | "local-only";
export const SKILL_SURFACES = ["local-agent", "webflow-site"] as const;
export type SkillSurface = (typeof SKILL_SURFACES)[number];

export const WEBFLOW_SITE_SURFACE = "webflow-site" as const;
export const WEBFLOW_MCP_VERSION = "2.0.1" as const;
export const WEBFLOW_MCP_COMPATIBILITY = ">=2.0.1 <3.0.0" as const;
export const WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION = 1 as const;
export const WEBFLOW_INSTRUCTION_ARCHIVE_PATH =
  ".slicemedia/agent-kit/webflow-agent-instructions.zip" as const;
export const WEBFLOW_INSTRUCTION_MANIFEST_PATH =
  ".slicemedia/agent-kit/webflow-agent-instructions.manifest.json" as const;
export const WEBFLOW_SITE_RULE_FILES = ["webflow-site.md"] as const;

export interface WebflowInstructionPackFile {
  path: string;
  sha256: string;
}

export interface WebflowInstructionPackManifest {
  schemaVersion: typeof WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION;
  product: "@slicemedia/agent-kit";
  version: string;
  surface: typeof WEBFLOW_SITE_SURFACE;
  webflowMcp: {
    testedVersion: typeof WEBFLOW_MCP_VERSION;
    compatibleRange: typeof WEBFLOW_MCP_COMPATIBILITY;
  };
  skills: Array<Pick<SkillMetadata, "name" | "description">>;
  files: WebflowInstructionPackFile[];
  archiveSha256: string;
}

export const ADAPTER_TARGETS = [
  "codex",
  "claude",
  "cursor",
  "copilot",
  "webflow",
] as const;

export type AdapterTarget = (typeof ADAPTER_TARGETS)[number];
export type ProjectAdapterTarget = AdapterTarget;
export type AdapterProfile = "workspace" | "project";

export interface AdapterManifest {
  schemaVersion: 3;
  product: "@slicemedia/agent-kit";
  webflowMcpVersion: typeof WEBFLOW_MCP_VERSION;
  source: "@slicemedia/agent-kit";
  profile: AdapterProfile;
  projectGuide: "WEBFLOW_PROJECT.md" | null;
  adapters: AdapterTarget[];
  skills: Array<Pick<SkillMetadata, "name" | "description">>;
  files: string[];
  digests: Record<string, string>;
}

export interface GenerateAdaptersOptions {
  profile?: AdapterProfile;
  targets?: readonly AdapterTarget[];
  force?: boolean;
}

interface AdapterPathScopes {
  browser: string[];
  operations: string[];
}

const adapterPathScopes: Record<AdapterProfile, AdapterPathScopes> = {
  workspace: {
    browser: ["src/**/*", "packages/*/src/**/*", "templates/*/src/**/*"],
    operations: [
      "scripts/**/*",
      "packages/*/scripts/**/*",
      "package.json",
      ".env*",
    ],
  },
  project: {
    browser: ["src/**/*"],
    operations: ["package.json", "**/*.config.*", ".env*"],
  },
};

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PROJECT_GUIDE = "WEBFLOW_PROJECT.md";
// ZIP stores local date fields. Constructing the DOS epoch in local time keeps
// every archive byte-stable across runs and host time zones.
const WEBFLOW_ARCHIVE_MTIME = new Date(1980, 0, 1, 0, 0, 0);

export function getAgentKitPaths(repoRoot = process.cwd()): AgentKitPaths {
  const resolvedRepoRoot = resolve(repoRoot);
  return {
    packageRoot,
    repoRoot: resolvedRepoRoot,
    contentRoot: join(packageRoot, "content"),
    skillsRoot: join(packageRoot, "skills"),
    generatedRoot: join(resolvedRepoRoot, ".slicemedia", "agent-kit"),
  };
}

function parseFrontmatter(source: string, directory: string): SkillMetadata {
  const block = source.match(/^---\n([\s\S]*?)\n---/u)?.[1];
  const name = block?.match(/^name:\s*(.+)$/mu)?.[1]?.trim();
  const description = block?.match(/^description:\s*(.+)$/mu)?.[1]?.trim();
  if (!name || !description) {
    throw new Error(`Invalid SKILL.md frontmatter in ${directory}`);
  }
  const rawSurfaces = block
    ?.match(/^\s+surfaces:\s*\[([^\]]*)\]\s*$/mu)?.[1]
    ?.split(",")
    .map((surface) => surface.trim())
    .filter(Boolean);
  if (!rawSurfaces || rawSurfaces.length === 0) {
    throw new Error(`Missing explicit skill surfaces in ${directory}`);
  }
  const unknownSurfaces = rawSurfaces.filter(
    (surface) => !SKILL_SURFACES.includes(surface as SkillSurface),
  );
  if (unknownSurfaces.length > 0) {
    throw new Error(
      `Invalid skill surfaces in ${directory}: ${unknownSurfaces.join(", ")}`,
    );
  }
  const surfaces = SKILL_SURFACES.filter((surface) =>
    rawSurfaces.includes(surface),
  );
  const distribution: SkillDistribution = surfaces.includes(
    WEBFLOW_SITE_SURFACE,
  )
    ? "all"
    : "local-only";
  return { name, description, directory, surfaces, distribution };
}

export async function collectSkills(
  paths = getAgentKitPaths(),
): Promise<SkillMetadata[]> {
  const entries = await readdir(paths.skillsRoot, { withFileTypes: true });
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const directory = join(paths.skillsRoot, entry.name);
        const source = await readFile(join(directory, "SKILL.md"), "utf8");
        return parseFrontmatter(source, directory);
      }),
  );
  return skills.sort((left, right) => left.name.localeCompare(right.name));
}

function cursorRule(frontmatter: string, body: string): string {
  return `---\n${frontmatter}\n---\n\n${body.trim()}\n`;
}

function copilotInstruction(applyTo: string, body: string): string {
  return `---\napplyTo: "${applyTo}"\n---\n\n${body.trim()}\n`;
}

function normalizeRelativePath(path: string): string {
  return path.split(sep).join("/");
}

function addOutput(
  outputs: Map<string, Uint8Array>,
  path: string,
  value: string | Uint8Array,
): void {
  outputs.set(
    normalizeRelativePath(path),
    typeof value === "string" ? strToU8(value) : value,
  );
}

async function addSelectedSkillFiles(
  outputs: Map<string, Uint8Array>,
  source: string,
  destination: string,
  includeYaml: boolean,
): Promise<void> {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "agents" && !includeYaml) continue;
      await addSelectedSkillFiles(outputs, from, to, includeYaml);
    } else if (
      entry.name.endsWith(".md") ||
      (includeYaml && entry.name.endsWith(".yaml"))
    ) {
      addOutput(outputs, to, await readFile(from));
    }
  }
}

async function addMarkdownEntries(
  entries: Record<string, Uint8Array>,
  root: string,
  prefix: string,
): Promise<void> {
  for (const child of await readdir(root, { withFileTypes: true })) {
    const path = join(root, child.name);
    if (child.isDirectory()) {
      if (child.name === "agents") continue;
      await addMarkdownEntries(entries, path, join(prefix, child.name));
    } else if (child.name.endsWith(".md") || child.name.endsWith(".mdc")) {
      entries[normalizeRelativePath(join(prefix, child.name))] =
        await readFile(path);
    }
  }
}

function selectedTargets(
  requested: readonly AdapterTarget[] | undefined,
): AdapterTarget[] {
  const targets = [...new Set(requested ?? ADAPTER_TARGETS)];
  for (const target of targets) {
    if (!ADAPTER_TARGETS.includes(target))
      throw new Error(`Unsupported adapter target: ${target}`);
  }
  return ADAPTER_TARGETS.filter((target) => targets.includes(target));
}

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function readPackageVersion(paths: AgentKitPaths): Promise<string> {
  const source = JSON.parse(
    await readFile(join(paths.packageRoot, "package.json"), "utf8"),
  ) as { name?: unknown; version?: unknown };
  if (
    source.name !== "@slicemedia/agent-kit" ||
    typeof source.version !== "string" ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(source.version)
  ) {
    throw new Error("Agent Kit package metadata has no valid release version");
  }
  return source.version;
}

function webflowPackMetadataRule(version: string): string {
  return `# Slice Media Agent Kit pack metadata

- Pack schema: ${WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION}
- Package: \`@slicemedia/agent-kit@${version}\`
- Distribution surface: \`${WEBFLOW_SITE_SURFACE}\`
- Tested Webflow MCP version: \`${WEBFLOW_MCP_VERSION}\`
- Compatible Webflow MCP range: \`${WEBFLOW_MCP_COMPATIBILITY}\`

This metadata identifies the imported instruction pack. It does not grant permission to change or publish a site. If the connected Webflow MCP version falls outside the compatible range, stop before mutation and request a reviewed Agent Kit update.
`;
}

async function buildWebflowInstructionPack(
  paths: AgentKitPaths,
  skills: SkillMetadata[],
): Promise<{
  archive: Uint8Array;
  manifest: WebflowInstructionPackManifest;
}> {
  const version = await readPackageVersion(paths);
  const entries: Record<string, Uint8Array> = {};

  for (const ruleFile of WEBFLOW_SITE_RULE_FILES) {
    entries[`rules/${ruleFile}`] = await readFile(
      join(paths.contentRoot, "rules", ruleFile),
    );
  }
  entries["rules/00-agent-kit-pack.md"] = strToU8(
    webflowPackMetadataRule(version),
  );

  const siteSkills = skills.filter((skill) =>
    skill.surfaces.includes(WEBFLOW_SITE_SURFACE),
  );
  for (const skill of siteSkills) {
    await addMarkdownEntries(
      entries,
      skill.directory,
      join("skills", skill.name),
    );
  }

  const sortedEntries = Object.entries(entries).sort(([left], [right]) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  const files = sortedEntries.map(([path, value]) => ({
    path,
    sha256: digest(value),
  }));
  const archive = zipSync(Object.fromEntries(sortedEntries), {
    level: 9,
    mtime: WEBFLOW_ARCHIVE_MTIME,
  });
  const manifest: WebflowInstructionPackManifest = {
    schemaVersion: WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION,
    product: "@slicemedia/agent-kit",
    version,
    surface: WEBFLOW_SITE_SURFACE,
    webflowMcp: {
      testedVersion: WEBFLOW_MCP_VERSION,
      compatibleRange: WEBFLOW_MCP_COMPATIBILITY,
    },
    skills: siteSkills.map(({ name, description }) => ({ name, description })),
    files,
    archiveSha256: digest(archive),
  };
  return { archive, manifest };
}

function resolveOwnedPath(root: string, path: string): string {
  const resolved = resolve(root, path);
  const prefix = `${resolve(root)}${sep}`;
  if (!resolved.startsWith(prefix))
    throw new Error(`Generated path escapes the project root: ${path}`);
  return resolved;
}

function isReservedUserProfilePath(root: string, path: string): boolean {
  const candidate = resolveOwnedPath(root, path).toLowerCase();
  return candidate === resolve(root, USER_PROFILE_RELATIVE_PATH).toLowerCase();
}

async function readPreviousManifest(
  path: string,
): Promise<AdapterManifest | undefined> {
  const source = await readFile(path, "utf8").catch(() => undefined);
  if (!source) return undefined;
  try {
    const manifest = JSON.parse(source) as Partial<AdapterManifest>;
    if (
      manifest.schemaVersion !== 3 ||
      !Array.isArray(manifest.files) ||
      !manifest.digests
    ) {
      throw new Error("Unsupported previous manifest schema");
    }
    return manifest as AdapterManifest;
  } catch (error) {
    throw new Error(
      `Cannot safely read previous Agent Kit manifest at ${path}`,
      { cause: error },
    );
  }
}

async function existingDigest(path: string): Promise<string | undefined> {
  const value = await readFile(path).catch(() => undefined);
  return value ? digest(value) : undefined;
}

async function pruneEmptyParents(path: string, stop: string): Promise<void> {
  let current = dirname(path);
  const boundary = resolve(stop);
  while (current.startsWith(`${boundary}${sep}`)) {
    const removed = await rmdir(current).then(
      () => true,
      () => false,
    );
    if (!removed) break;
    current = dirname(current);
  }
}

async function applyOutputs(
  paths: AgentKitPaths,
  outputs: Map<string, Uint8Array>,
  previous: AdapterManifest | undefined,
  force: boolean,
): Promise<void> {
  const previousFiles = new Set(
    (previous?.files ?? []).filter(
      (path) =>
        path !== PROJECT_GUIDE &&
        !isReservedUserProfilePath(paths.repoRoot, path),
    ),
  );
  const obsolete = [...previousFiles].filter((path) => !outputs.has(path));
  const conflicts: string[] = [];

  for (const path of outputs.keys()) {
    if (isReservedUserProfilePath(paths.repoRoot, path)) {
      throw new Error("Adapter generation cannot own the local user profile");
    }
    const absolute = resolveOwnedPath(paths.repoRoot, path);
    const current = await existingDigest(absolute);
    if (!current) continue;
    if (path === PROJECT_GUIDE) continue;
    const isUnchangedOwnedFile =
      previousFiles.has(path) &&
      previous?.digests[path] !== undefined &&
      previous.digests[path] === current;
    if (!isUnchangedOwnedFile && !force) conflicts.push(path);
  }

  for (const path of obsolete) {
    const absolute = resolveOwnedPath(paths.repoRoot, path);
    const current = await existingDigest(absolute);
    if (!current) continue;
    if (previous?.digests[path] !== current && !force) conflicts.push(path);
  }

  if (conflicts.length > 0) {
    throw new Error(
      `Refusing to overwrite or remove existing adapter files: ${[...new Set(conflicts)].sort().join(", ")}. Re-run with force only after review.`,
    );
  }

  for (const path of obsolete) {
    const absolute = resolveOwnedPath(paths.repoRoot, path);
    await unlink(absolute).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    await pruneEmptyParents(absolute, paths.repoRoot);
  }

  for (const [path, value] of outputs) {
    const absolute = resolveOwnedPath(paths.repoRoot, path);
    if (path === PROJECT_GUIDE && (await existingDigest(absolute))) continue;
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, value);
  }
}

async function composeOutputs(
  paths: AgentKitPaths,
  profile: AdapterProfile,
  targets: AdapterTarget[],
  skills: SkillMetadata[],
): Promise<Map<string, Uint8Array>> {
  const outputs = new Map<string, Uint8Array>();
  const repository = await readFile(
    join(
      paths.contentRoot,
      "rules",
      profile === "project" ? "project.md" : "repository.md",
    ),
    "utf8",
  );
  const browser = await readFile(
    join(paths.contentRoot, "rules", "browser-code.md"),
    "utf8",
  );
  const operations = await readFile(
    join(paths.contentRoot, "rules", "operations.md"),
    "utf8",
  );
  const localUserProfile = await readFile(
    join(paths.contentRoot, "rules", "local-user-profile.md"),
    "utf8",
  );
  const handoff = await readFile(
    join(paths.contentRoot, "rules", "handoff.md"),
    "utf8",
  );
  const localRepository = `${repository.trim()}\n\n${handoff.trim()}\n\n${localUserProfile.trim()}\n`;
  const pathScopes = adapterPathScopes[profile];

  if (profile === "project") addOutput(outputs, PROJECT_GUIDE, repository);

  if (targets.includes("codex")) {
    addOutput(outputs, "AGENTS.md", localRepository);
    for (const skill of skills) {
      await addSelectedSkillFiles(
        outputs,
        skill.directory,
        join(".agents", "skills", skill.name),
        true,
      );
    }
  }

  if (targets.includes("claude")) {
    addOutput(
      outputs,
      "CLAUDE.md",
      `${localRepository.trim()}\n\nClaude skills are generated in \`.claude/skills/\`. Load the matching skill before specialized work.\n`,
    );
    for (const skill of skills) {
      await addSelectedSkillFiles(
        outputs,
        skill.directory,
        join(".claude", "skills", skill.name),
        false,
      );
    }
  }

  if (targets.includes("cursor")) {
    addOutput(
      outputs,
      join(".cursor", "rules", "00-foundation.mdc"),
      cursorRule(
        'description: Core Webflow project and safety rules\nglobs: "**/*"\nalwaysApply: true',
        localRepository,
      ),
    );
    addOutput(
      outputs,
      join(".cursor", "rules", "10-browser-code.mdc"),
      cursorRule(
        `description: Browser enhancement and composition rules\nglobs: ${JSON.stringify(pathScopes.browser)}\nalwaysApply: false`,
        browser,
      ),
    );
    addOutput(
      outputs,
      join(".cursor", "rules", "20-operations.mdc"),
      cursorRule(
        `description: Webflow inspection and explicit remote operation safety\nglobs: ${JSON.stringify(pathScopes.operations)}\nalwaysApply: false`,
        operations,
      ),
    );
    for (const skill of skills) {
      await addSelectedSkillFiles(
        outputs,
        skill.directory,
        join(".cursor", "skills", skill.name),
        false,
      );
    }
  }

  if (targets.includes("copilot")) {
    addOutput(
      outputs,
      join(".github", "copilot-instructions.md"),
      localRepository,
    );
    addOutput(
      outputs,
      join(".github", "instructions", "browser.instructions.md"),
      copilotInstruction(pathScopes.browser.join(","), browser),
    );
    addOutput(
      outputs,
      join(".github", "instructions", "operations.instructions.md"),
      copilotInstruction(pathScopes.operations.join(","), operations),
    );
    for (const skill of skills) {
      await addSelectedSkillFiles(
        outputs,
        skill.directory,
        join(".github", "skills", skill.name),
        false,
      );
    }
  }

  if (targets.includes("webflow")) {
    const pack = await buildWebflowInstructionPack(paths, skills);
    addOutput(outputs, WEBFLOW_INSTRUCTION_ARCHIVE_PATH, pack.archive);
    addOutput(
      outputs,
      WEBFLOW_INSTRUCTION_MANIFEST_PATH,
      `${JSON.stringify(pack.manifest, null, 2)}\n`,
    );
  }

  return outputs;
}

export async function generateAdapters(
  repoRoot?: string,
  options: GenerateAdaptersOptions = {},
): Promise<AdapterManifest> {
  const paths = getAgentKitPaths(repoRoot);
  const profile = options.profile ?? "project";
  if (profile === "project" && options.targets === undefined) {
    throw new Error(
      "Project generation requires an explicit targets array, including [] for none",
    );
  }
  const targets = selectedTargets(options.targets);
  const skills = await collectSkills(paths);
  const outputs = await composeOutputs(paths, profile, targets, skills);
  const manifestPath = join(paths.generatedRoot, "agent-adapters.json");
  const previous = await readPreviousManifest(manifestPath);

  await applyOutputs(paths, outputs, previous, options.force ?? false);

  const ownedOutputs = new Map(
    [...outputs].filter(
      ([path]) =>
        path !== PROJECT_GUIDE &&
        !isReservedUserProfilePath(paths.repoRoot, path),
    ),
  );
  const files = [...ownedOutputs.keys()].sort();
  const manifest: AdapterManifest = {
    schemaVersion: 3,
    product: "@slicemedia/agent-kit",
    webflowMcpVersion: WEBFLOW_MCP_VERSION,
    source: "@slicemedia/agent-kit",
    profile,
    projectGuide: profile === "project" ? PROJECT_GUIDE : null,
    adapters: targets,
    skills: skills.map(({ name, description }) => ({ name, description })),
    files,
    digests: Object.fromEntries(
      files.map((path) => [path, digest(ownedOutputs.get(path)!)]),
    ),
  };
  await mkdir(paths.generatedRoot, { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}

export async function listGeneratedFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function visit(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) await visit(target);
      else files.push(normalizeRelativePath(relative(root, target)));
    }
  }
  if ((await stat(root).catch(() => undefined))?.isDirectory())
    await visit(root);
  return files.sort();
}
