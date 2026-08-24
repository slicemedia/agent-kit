import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, join, matchesGlob, relative } from "node:path";

import { unzipSync } from "fflate";

import {
  ADAPTER_TARGETS,
  type AdapterManifest,
  type AdapterTarget,
  collectSkills,
  getAgentKitPaths,
  WEBFLOW_INSTRUCTION_ARCHIVE_PATH,
  WEBFLOW_INSTRUCTION_MANIFEST_PATH,
  WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION,
  WEBFLOW_MCP_COMPATIBILITY,
  WEBFLOW_MCP_VERSION,
  WEBFLOW_SITE_RULE_FILES,
  WEBFLOW_SITE_SURFACE,
  type WebflowInstructionPackManifest,
} from "./generate.js";

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  checkedSkills: number;
  checkedFiles: number;
}

const explicitOnly = new Set([
  "audit-webflow-class-cleanup",
  "configure-agent-user-profile",
  "deploy-digitalocean-spaces",
  "edit-webflow-cms-safely",
  "edit-webflow-designer-safely",
  "manage-webflow-agent-instructions",
  "manage-webflow-attributes",
  "manage-webflow-custom-code",
  "migrate-content-to-webflow-cms",
  "publish-webflow-staging",
]);

const mcpAware = new Set([
  "audit-webflow-class-cleanup",
  "audit-webflow-client-first",
  "audit-webflow-performance",
  "build-webflow-motion",
  "build-webflow-with-client-first",
  "debug-webflow-enhancement",
  "edit-webflow-cms-safely",
  "edit-webflow-designer-safely",
  "diagnose-webflow-layout",
  "inspect-webflow-site",
  "integrate-finsweet-attributes",
  "manage-webflow-agent-instructions",
  "manage-webflow-attributes",
  "manage-webflow-custom-code",
  "migrate-content-to-webflow-cms",
  "publish-webflow-staging",
  "test-webflow-local-development",
]);

const recoveryAware = new Set([
  "audit-webflow-class-cleanup",
  "build-webflow-motion",
  "build-webflow-with-client-first",
  "diagnose-webflow-layout",
  "edit-webflow-cms-safely",
  "edit-webflow-designer-safely",
  "integrate-finsweet-attributes",
  "manage-webflow-attributes",
  "manage-webflow-custom-code",
  "migrate-content-to-webflow-cms",
]);

const handoffAware = new Set([
  "audit-webflow-class-cleanup",
  "audit-webflow-client-first",
  "audit-webflow-performance",
  "author-webflow-addon",
  "build-webflow-motion",
  "build-webflow-slider",
  "build-webflow-with-client-first",
  "configure-webflow-forms",
  "debug-webflow-enhancement",
  "diagnose-webflow-layout",
  "edit-webflow-cms-safely",
  "edit-webflow-designer-safely",
  "inspect-webflow-site",
  "integrate-finsweet-attributes",
  "manage-webflow-agent-instructions",
  "manage-webflow-attributes",
  "manage-webflow-custom-code",
  "migrate-content-to-webflow-cms",
  "publish-webflow-staging",
  "review-webflow-accessibility",
  "test-webflow-local-development",
  "test-webflow-staging",
  "translate-figma-to-webflow",
]);

const legacyMcpNames = [
  "de_page_tool",
  "de_component_tool",
  "de_element_tool",
  "element_builder",
  "component_builder",
  "element_tool",
  "style_tool",
  "variable_tool",
  "site_tool",
  "cms_tool",
];

export function findOutdatedMcpNames(source: string): string[] {
  return legacyMcpNames.filter((name) =>
    new RegExp(`(?<!data_)\\b${name}\\b`, "u").test(source),
  );
}

interface EvaluationScenario {
  id: string;
  category: "positive" | "negative" | "destructive";
  prompt: string;
  expectedSkill: string | null;
  expectedAction: "invoke" | "do-not-invoke" | "refuse-mutation";
}

async function textFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function visit(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const target = join(path, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (/\.(?:md|mdc|yaml|json)$/u.test(entry.name)) files.push(target);
    }
  }
  if ((await stat(root).catch(() => undefined))?.isDirectory())
    await visit(root);
  return files;
}

const ignoredApplicabilityDirectories = new Set([
  ".agents",
  ".claude",
  ".cursor",
  ".git",
  ".github",
  ".slicemedia",
  "coverage",
  "dist",
  "node_modules",
]);

async function repositoryFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  async function visit(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        ignoredApplicabilityDirectories.has(entry.name)
      )
        continue;
      const target = join(path, entry.name);
      if (entry.isDirectory()) await visit(target);
      else files.push(relative(root, target).replaceAll("\\", "/"));
    }
  }
  await visit(root);
  return files;
}

function frontmatterPatterns(
  source: string,
  key: "applyTo" | "globs",
): string[] {
  const frontmatter = source.match(/^---\n([\s\S]*?)\n---/u)?.[1] ?? "";
  const raw = frontmatter
    .match(new RegExp(`^${key}:\\s*(.+)$`, "mu"))?.[1]
    ?.trim();
  if (!raw) return [];
  if (raw.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(
            (pattern): pattern is string => typeof pattern === "string",
          )
        : [];
    } catch {
      return [];
    }
  }
  const unquoted = raw
    .replace(/^(.*?)$/u, "$1")
    .replace(/^(?:"|')|(?:"|')$/gu, "");
  return key === "applyTo"
    ? unquoted.split(",").map((pattern) => pattern.trim())
    : [unquoted];
}

function expectedAdapterPaths(target: AdapterTarget): string[] {
  switch (target) {
    case "codex":
      return ["AGENTS.md", ".agents/skills/"];
    case "claude":
      return ["CLAUDE.md", ".claude/skills/"];
    case "cursor":
      return [
        ".cursor/rules/00-foundation.mdc",
        ".cursor/rules/10-browser-code.mdc",
        ".cursor/rules/20-operations.mdc",
        ".cursor/skills/",
      ];
    case "copilot":
      return [
        ".github/copilot-instructions.md",
        ".github/instructions/browser.instructions.md",
        ".github/instructions/operations.instructions.md",
        ".github/skills/",
      ];
    case "webflow":
      return [
        WEBFLOW_INSTRUCTION_ARCHIVE_PATH,
        WEBFLOW_INSTRUCTION_MANIFEST_PATH,
      ];
  }
}

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function readManifest(
  path: string,
  errors: string[],
): Promise<AdapterManifest | undefined> {
  const source = await readFile(path, "utf8").catch(() => undefined);
  if (!source) {
    errors.push(`Missing generated adapter manifest: ${path}`);
    return undefined;
  }
  try {
    const manifest = JSON.parse(source) as AdapterManifest;
    if (manifest.schemaVersion !== 3)
      errors.push("Generated adapter manifest must use schema 3");
    if (manifest.product !== "@slicemedia/agent-kit") {
      errors.push("Generated adapter manifest declares the wrong product");
    }
    if (manifest.webflowMcpVersion !== WEBFLOW_MCP_VERSION) {
      errors.push(
        `Generated adapter manifest must declare Webflow MCP version ${WEBFLOW_MCP_VERSION}`,
      );
    }
    if (manifest.adapters.some((target) => !ADAPTER_TARGETS.includes(target))) {
      errors.push("Generated adapter manifest contains an unsupported target");
    }
    return manifest;
  } catch {
    errors.push(`Invalid generated adapter manifest: ${path}`);
    return undefined;
  }
}

export async function validateAdapters(
  repoRoot?: string,
): Promise<ValidationResult> {
  const paths = getAgentKitPaths(repoRoot);
  const skills = await collectSkills(paths);
  const skillNames = new Set(skills.map((skill) => skill.name));
  const errors: string[] = [];

  for (const skill of skills) {
    const directoryName = basename(skill.directory);
    if (directoryName !== skill.name)
      errors.push(`Skill directory does not match name: ${skill.name}`);
    const source = await readFile(join(skill.directory, "SKILL.md"), "utf8");
    const yamlPath = join(skill.directory, "agents", "openai.yaml");
    const yaml = await readFile(yamlPath, "utf8").catch(() => "");
    if (!yaml.includes(`$${skill.name}`))
      errors.push(`Default prompt omits $${skill.name}`);
    if (
      explicitOnly.has(skill.name) &&
      !yaml.includes("allow_implicit_invocation: false")
    ) {
      errors.push(`${skill.name} must disable implicit invocation`);
    }
    const isWebflowSiteSkill = skill.surfaces.includes(WEBFLOW_SITE_SURFACE);
    if (
      (mcpAware.has(skill.name) || isWebflowSiteSkill) &&
      !source.includes(`Webflow MCP version: ${WEBFLOW_MCP_VERSION}.`)
    ) {
      errors.push(`${skill.name} must declare Webflow MCP version 2.0.1`);
    }
    if (isWebflowSiteSkill && !source.includes("webflow_guide_tool")) {
      errors.push(
        `${skill.name} must consult webflow_guide_tool before site-native work`,
      );
    }
    if (
      recoveryAware.has(skill.name) &&
      (!source.toLowerCase().includes("restore point") ||
        !source.toLowerCase().includes("waiver"))
    ) {
      errors.push(
        `${skill.name} must include the high-risk restore-point or waiver checkpoint`,
      );
    }
    if (
      handoffAware.has(skill.name) &&
      !source.toLowerCase().includes("editor-facing handoff")
    ) {
      errors.push(`${skill.name} must include an editor-facing handoff`);
    }
  }

  for (const ruleName of ["operations.md", "project.md", "repository.md"]) {
    const source = await readFile(
      join(paths.contentRoot, "rules", ruleName),
      "utf8",
    );
    if (
      !source.toLowerCase().includes("restore point") ||
      !source.toLowerCase().includes("waiver")
    ) {
      errors.push(
        `${ruleName} must include the high-risk restore-point or waiver checkpoint`,
      );
    }
  }
  const handoffRule = await readFile(
    join(paths.contentRoot, "rules", "handoff.md"),
    "utf8",
  );
  for (const required of [
    "one component instance",
    "every component instance",
    "collection schema",
    "publication state",
    "recovery checkpoint",
  ]) {
    if (!handoffRule.includes(required)) {
      errors.push(`Editor handoff guidance omits: ${required}`);
    }
  }

  const manifest = await readManifest(
    join(paths.generatedRoot, "agent-adapters.json"),
    errors,
  );
  const generatedFiles = manifest?.files ?? [];
  if (
    manifest?.profile === "project" &&
    !(await stat(join(paths.repoRoot, "WEBFLOW_PROJECT.md")).catch(
      () => undefined,
    ))
  ) {
    errors.push("Project adapters must include WEBFLOW_PROJECT.md");
  }

  for (const path of generatedFiles) {
    const value = await readFile(join(paths.repoRoot, path)).catch(
      () => undefined,
    );
    if (!value) {
      errors.push(`Missing generated file recorded by manifest: ${path}`);
    } else if (manifest?.digests[path] !== digest(value)) {
      errors.push(`Generated file differs from its recorded digest: ${path}`);
    }
  }

  for (const target of manifest?.adapters ?? []) {
    for (const path of expectedAdapterPaths(target)) {
      const exists = path.endsWith("/")
        ? generatedFiles.some((file) => file.startsWith(path))
        : generatedFiles.includes(path);
      if (!exists) errors.push(`Missing generated ${target} adapter: ${path}`);
    }
  }

  for (const target of ADAPTER_TARGETS) {
    if (manifest?.adapters.includes(target)) continue;
    for (const path of expectedAdapterPaths(target)) {
      const recorded = path.endsWith("/")
        ? generatedFiles.some((file) => file.startsWith(path))
        : generatedFiles.includes(path);
      if (recorded)
        errors.push(
          `Unselected target is recorded in generated files: ${target}`,
        );
    }
  }

  if (manifest?.adapters.includes("webflow")) {
    const archivePath = join(paths.repoRoot, WEBFLOW_INSTRUCTION_ARCHIVE_PATH);
    const packManifestPath = join(
      paths.repoRoot,
      WEBFLOW_INSTRUCTION_MANIFEST_PATH,
    );
    const archive = await readFile(archivePath).catch(() => undefined);
    const packManifestSource = await readFile(packManifestPath, "utf8").catch(
      () => undefined,
    );
    if (archive && packManifestSource) {
      try {
        const packManifest = JSON.parse(
          packManifestSource,
        ) as WebflowInstructionPackManifest;
        const packageMetadata = JSON.parse(
          await readFile(join(paths.packageRoot, "package.json"), "utf8"),
        ) as { version?: unknown };
        const archiveEntries = unzipSync(archive);
        const entryPaths = Object.keys(archiveEntries);
        const siteSkills = skills.filter((skill) =>
          skill.surfaces.includes(WEBFLOW_SITE_SURFACE),
        );
        const siteSkillNames = new Set(siteSkills.map((skill) => skill.name));
        const expectedRules = new Set([
          "rules/00-agent-kit-pack.md",
          ...WEBFLOW_SITE_RULE_FILES.map((file) => `rules/${file}`),
        ]);

        if (
          packManifest.schemaVersion !== WEBFLOW_INSTRUCTION_PACK_SCHEMA_VERSION
        ) {
          errors.push("Webflow instruction pack uses an unsupported schema");
        }
        if (
          packManifest.product !== "@slicemedia/agent-kit" ||
          packManifest.version !== packageMetadata.version
        ) {
          errors.push(
            "Webflow instruction pack product version does not match Agent Kit",
          );
        }
        if (packManifest.surface !== WEBFLOW_SITE_SURFACE) {
          errors.push("Webflow instruction pack declares the wrong surface");
        }
        if (
          packManifest.webflowMcp?.testedVersion !== WEBFLOW_MCP_VERSION ||
          packManifest.webflowMcp?.compatibleRange !== WEBFLOW_MCP_COMPATIBILITY
        ) {
          errors.push(
            "Webflow instruction pack has invalid MCP compatibility metadata",
          );
        }
        if (packManifest.archiveSha256 !== digest(archive)) {
          errors.push("Webflow instruction pack archive digest does not match");
        }

        const recordedPaths = packManifest.files.map((file) => file.path);
        if (
          JSON.stringify(recordedPaths) !==
          JSON.stringify([...recordedPaths].sort())
        ) {
          errors.push("Webflow instruction pack files must be sorted");
        }
        if (
          JSON.stringify(recordedPaths) !==
          JSON.stringify([...entryPaths].sort())
        ) {
          errors.push(
            "Webflow instruction pack manifest does not match archive entries",
          );
        }
        for (const file of packManifest.files) {
          const value = archiveEntries[file.path];
          if (!value || digest(value) !== file.sha256) {
            errors.push(
              `Webflow instruction pack file digest does not match: ${file.path}`,
            );
          }
        }

        for (const entry of entryPaths) {
          const skillName = entry.match(/^skills\/([^/]+)\//u)?.[1];
          const allowed = skillName
            ? siteSkillNames.has(skillName)
            : expectedRules.has(entry);
          if (!allowed || !/\.(?:md|mdc)$/u.test(entry)) {
            errors.push(
              `Webflow instruction pack contains a non-site-safe path: ${entry}`,
            );
          }
        }

        for (const skill of skills) {
          const included = entryPaths.some((entry) =>
            entry.startsWith(`skills/${skill.name}/`),
          );
          if (skill.surfaces.includes(WEBFLOW_SITE_SURFACE) && !included) {
            errors.push(
              `Site-safe skill is missing from Webflow Agent Instructions: ${skill.name}`,
            );
          }
          if (!skill.surfaces.includes(WEBFLOW_SITE_SURFACE) && included) {
            errors.push(
              `Non-site skill is present in Webflow Agent Instructions: ${skill.name}`,
            );
          }
        }
        if (
          JSON.stringify(packManifest.skills) !==
          JSON.stringify(
            siteSkills.map(({ name, description }) => ({ name, description })),
          )
        ) {
          errors.push(
            "Webflow instruction pack skill allowlist does not match canonical surfaces",
          );
        }
      } catch {
        errors.push(
          `Invalid Webflow instruction pack manifest: ${packManifestPath}`,
        );
      }
    }
  }

  const repositoryPaths = await repositoryFiles(paths.repoRoot);
  const scopedAdapters = [
    ["cursor", ".cursor/rules/10-browser-code.mdc", "globs"],
    ["cursor", ".cursor/rules/20-operations.mdc", "globs"],
    ["copilot", ".github/instructions/browser.instructions.md", "applyTo"],
    ["copilot", ".github/instructions/operations.instructions.md", "applyTo"],
  ] as const;
  for (const [target, path, key] of scopedAdapters) {
    if (!manifest?.adapters.includes(target)) continue;
    const source = await readFile(join(paths.repoRoot, path), "utf8").catch(
      () => "",
    );
    const patterns = frontmatterPatterns(source, key);
    if (patterns.length === 0) {
      errors.push(`Generated adapter has no valid path scope: ${path}`);
      continue;
    }
    if (
      !patterns.some((pattern) =>
        repositoryPaths.some((file) => matchesGlob(file, pattern)),
      )
    ) {
      errors.push(
        `Generated adapter path scope matches no repository files: ${path}`,
      );
    }
  }

  const files = [
    ...(await textFiles(paths.contentRoot)),
    ...(await textFiles(paths.skillsRoot)),
    ...(await textFiles(join(paths.repoRoot, ".agents"))),
    ...(await textFiles(join(paths.repoRoot, ".claude"))),
    ...(await textFiles(join(paths.repoRoot, ".cursor"))),
    ...(await textFiles(join(paths.repoRoot, ".github", "instructions"))),
  ];
  for (const path of files) {
    const source = await readFile(path, "utf8");
    if (/\bTODO\b|\[TODO/u.test(source))
      errors.push(`Unresolved placeholder: ${path}`);
    for (const legacy of findOutdatedMcpNames(source)) {
      errors.push(`Instruction references legacy MCP name ${legacy}: ${path}`);
    }
  }

  const evaluationSource = JSON.parse(
    await readFile(
      join(paths.contentRoot, "evals", "skill-scenarios.json"),
      "utf8",
    ),
  ) as {
    schemaVersion?: number;
    webflowMcpVersion?: string;
    scenarios?: EvaluationScenario[];
  };
  const scenarios = evaluationSource.scenarios ?? [];
  if (evaluationSource.schemaVersion !== 1 || scenarios.length < 12) {
    errors.push(
      "Agent evaluation scenarios are incomplete or use an unsupported schema",
    );
  }
  if (evaluationSource.webflowMcpVersion !== "2.0.1") {
    errors.push(
      "Agent evaluation scenarios must declare Webflow MCP version 2.0.1",
    );
  }
  const scenarioIds = new Set<string>();
  for (const scenario of scenarios) {
    if (scenarioIds.has(scenario.id))
      errors.push(`Duplicate agent evaluation: ${scenario.id}`);
    scenarioIds.add(scenario.id);
    if (scenario.prompt.trim() === "")
      errors.push(`Agent evaluation has no prompt: ${scenario.id}`);
    if (
      scenario.expectedSkill !== null &&
      !skillNames.has(scenario.expectedSkill)
    ) {
      errors.push(
        `Agent evaluation references an unknown skill: ${scenario.id}`,
      );
    }
    if (
      scenario.expectedSkill !== null &&
      explicitOnly.has(scenario.expectedSkill) &&
      !scenario.prompt.includes(`$${scenario.expectedSkill}`)
    ) {
      errors.push(
        `Explicit-only agent evaluation must name $${scenario.expectedSkill}: ${scenario.id}`,
      );
    }
    if (
      scenario.category === "negative" &&
      scenario.expectedAction !== "do-not-invoke"
    ) {
      errors.push(
        `Negative agent evaluation must not invoke a skill: ${scenario.id}`,
      );
    }
    if (
      scenario.category === "destructive" &&
      scenario.expectedAction !== "refuse-mutation"
    ) {
      errors.push(
        `Destructive agent evaluation must refuse unsafe mutation: ${scenario.id}`,
      );
    }
  }
  for (const skillName of explicitOnly) {
    if (
      !scenarios.some(
        (scenario) =>
          scenario.category === "destructive" &&
          scenario.expectedSkill === skillName,
      )
    ) {
      errors.push(
        `Explicit-only skill lacks a destructive-action evaluation: ${skillName}`,
      );
    }
  }

  const plugin = JSON.parse(
    await readFile(
      join(paths.packageRoot, ".codex-plugin", "plugin.json"),
      "utf8",
    ),
  ) as Record<string, unknown>;
  if (plugin.name !== "agent-kit" || plugin.skills !== "./skills/") {
    errors.push(
      "Codex plugin manifest must expose the canonical Agent Kit skills",
    );
  }
  if ("mcpServers" in plugin || "apps" in plugin) {
    errors.push("The skills-only plugin must not declare MCP servers or apps");
  }

  const upstream = JSON.parse(
    await readFile(
      join(paths.contentRoot, "upstream", "webflow-skills.json"),
      "utf8",
    ),
  ) as {
    commit?: string;
    license?: string;
    vendored?: boolean;
    webflowMcpVersion?: string;
  };
  if (!/^[a-f0-9]{40}$/u.test(upstream.commit ?? "")) {
    errors.push("Official Webflow skills must be pinned to a full commit hash");
  }
  if (!upstream.license || upstream.vendored !== false) {
    errors.push(
      "Official Webflow skills require recorded licensing and must not be vendored",
    );
  }
  if (upstream.webflowMcpVersion !== "2.0.1") {
    errors.push(
      "Official Webflow skill metadata must record MCP version 2.0.1",
    );
  }

  return {
    ok: errors.length === 0,
    errors,
    checkedSkills: skills.length,
    checkedFiles: files.length,
  };
}
