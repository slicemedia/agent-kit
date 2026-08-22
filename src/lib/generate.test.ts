import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, matchesGlob } from "node:path";

import { unzipSync } from "fflate";
import { afterEach, describe, expect, it } from "vitest";

import {
  ADAPTER_TARGETS,
  collectSkills,
  generateAdapters,
} from "./generate.js";
import { validateAdapters } from "./validate.js";

async function seedProject(root: string): Promise<string[]> {
  const projectPaths = [
    "src/main.ts",
    "package.json",
    "vite.config.ts",
    ".env.example",
  ];
  for (const path of projectPaths) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), path === "package.json" ? "{}\n" : "\n");
  }
  return projectPaths;
}

async function exists(path: string): Promise<boolean> {
  return Boolean(await stat(path).catch(() => undefined));
}

const temporaryProjects = new Set<string>();

async function temporaryProject(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryProjects.add(root);
  return root;
}

afterEach(async () => {
  const projects = [...temporaryProjects];
  temporaryProjects.clear();
  await Promise.all(
    projects.map((project) => rm(project, { recursive: true, force: true })),
  );
});

describe("agent adapter generation", () => {
  it("discovers every focused canonical skill", async () => {
    const skills = await collectSkills();
    expect(skills).toHaveLength(24);
    expect(skills.map((skill) => skill.name)).toEqual(
      expect.arrayContaining([
        "audit-webflow-class-cleanup",
        "audit-webflow-performance",
        "build-webflow-motion",
        "build-webflow-with-client-first",
        "configure-agent-user-profile",
        "debug-webflow-enhancement",
        "deploy-digitalocean-spaces",
        "edit-webflow-designer-safely",
        "diagnose-webflow-layout",
        "integrate-finsweet-attributes",
        "manage-webflow-attributes",
        "manage-webflow-agent-instructions",
        "migrate-content-to-webflow-cms",
        "test-webflow-local-development",
      ]),
    );
    expect(
      skills.find((skill) => skill.name === "test-webflow-local-development")
        ?.distribution,
    ).toBe("local-only");
  });

  it("generates only selected project adapters and a neutral guide", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-");
    const projectPaths = await seedProject(root);
    const manifest = await generateAdapters(root, {
      profile: "project",
      targets: ["codex", "cursor", "webflow"],
    });

    expect(manifest).toMatchObject({
      schemaVersion: 3,
      product: "@slicemedia/agent-kit",
      webflowMcpVersion: "2.0.1",
      profile: "project",
      projectGuide: "WEBFLOW_PROJECT.md",
      adapters: ["codex", "cursor", "webflow"],
    });
    expect(await readFile(join(root, "WEBFLOW_PROJECT.md"), "utf8")).toContain(
      "src/main.ts",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      "data-wft-*",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      ".slicemedia/agent-kit/user-profile.local.md",
    );
    expect(await readFile(join(root, "AGENTS.md"), "utf8")).toContain(
      "Editor-facing handoff",
    );
    expect(await exists(join(root, "CLAUDE.md"))).toBe(false);
    expect(
      await exists(
        join(root, ".slicemedia", "agent-kit", "user-profile.local.md"),
      ),
    ).toBe(false);
    expect(await exists(join(root, ".github", "copilot-instructions.md"))).toBe(
      false,
    );
    expect(await exists(join(root, ".github", "skills"))).toBe(false);

    const designerSkill = await readFile(
      join(
        root,
        ".agents",
        "skills",
        "edit-webflow-designer-safely",
        "SKILL.md",
      ),
      "utf8",
    );
    expect(designerSkill).toContain("Webflow MCP version: 2.0.1");
    expect(
      await readFile(
        join(
          root,
          ".agents",
          "skills",
          "configure-agent-user-profile",
          "agents",
          "openai.yaml",
        ),
        "utf8",
      ),
    ).toContain("allow_implicit_invocation: false");
    for (const explicitSkill of [
      "audit-webflow-class-cleanup",
      "migrate-content-to-webflow-cms",
    ]) {
      expect(
        await readFile(
          join(
            root,
            ".agents",
            "skills",
            explicitSkill,
            "agents",
            "openai.yaml",
          ),
          "utf8",
        ),
      ).toContain("allow_implicit_invocation: false");
    }
    expect(
      await readFile(
        join(
          root,
          ".agents",
          "skills",
          "build-webflow-with-client-first",
          "references",
          "client-first-conventions.md",
        ),
        "utf8",
      ),
    ).toContain("Client-First 2.1");
    expect(
      await readFile(
        join(
          root,
          ".agents",
          "skills",
          "build-webflow-with-client-first",
          "agents",
          "openai.yaml",
        ),
        "utf8",
      ),
    ).toContain("$build-webflow-with-client-first");

    expect(
      await readFile(
        join(root, ".cursor", "rules", "00-foundation.mdc"),
        "utf8",
      ),
    ).toContain("user-profile.local.md");
    expect(
      await readFile(
        join(root, ".cursor", "rules", "00-foundation.mdc"),
        "utf8",
      ),
    ).toContain("Editor-facing handoff");
    expect(
      await readFile(
        join(
          root,
          ".cursor",
          "skills",
          "build-webflow-with-client-first",
          "SKILL.md",
        ),
        "utf8",
      ),
    ).toContain("Client-First");
    expect(
      await exists(
        join(
          root,
          ".cursor",
          "skills",
          "build-webflow-with-client-first",
          "agents",
          "openai.yaml",
        ),
      ),
    ).toBe(false);

    const archiveEntries = Object.keys(
      unzipSync(
        await readFile(
          join(
            root,
            ".slicemedia",
            "agent-kit",
            "webflow-agent-instructions.zip",
          ),
        ),
      ),
    );
    expect(archiveEntries).toContain("rules/project.md");
    expect(archiveEntries).toContain("rules/handoff.md");
    expect(archiveEntries).toContain(
      "skills/manage-webflow-attributes/SKILL.md",
    );
    expect(archiveEntries).toContain(
      "skills/build-webflow-with-client-first/SKILL.md",
    );
    expect(archiveEntries).toContain(
      "skills/build-webflow-with-client-first/references/client-first-conventions.md",
    );
    for (const focusedSkill of [
      "audit-webflow-class-cleanup",
      "audit-webflow-performance",
      "build-webflow-motion",
      "diagnose-webflow-layout",
      "integrate-finsweet-attributes",
      "migrate-content-to-webflow-cms",
    ]) {
      expect(archiveEntries).toContain(`skills/${focusedSkill}/SKILL.md`);
    }
    expect(archiveEntries).not.toContain(
      "skills/test-webflow-local-development/SKILL.md",
    );
    expect(
      archiveEntries.some((entry) =>
        entry.startsWith("skills/configure-agent-user-profile/"),
      ),
    ).toBe(false);
    expect(archiveEntries).not.toContain("rules/local-user-profile.md");
    expect(archiveEntries.every((entry) => entry.endsWith(".md"))).toBe(true);

    const cursorOperations = await readFile(
      join(root, ".cursor", "rules", "20-operations.mdc"),
      "utf8",
    );
    const cursorPatterns = JSON.parse(
      cursorOperations.match(/^globs:\s*(\[[^\n]+\])$/mu)?.[1] ?? "[]",
    ) as string[];
    expect(
      projectPaths.some((path) =>
        cursorPatterns.some((pattern) => matchesGlob(path, pattern)),
      ),
    ).toBe(true);
    await expect(validateAdapters(root)).resolves.toMatchObject({
      ok: true,
      checkedSkills: 24,
    });
  });

  it("distributes canonical focused skills to Cursor and Copilot without provider metadata", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-focused-skills-");
    await seedProject(root);
    const skills = await collectSkills();
    const manifest = await generateAdapters(root, {
      profile: "project",
      targets: ["cursor", "copilot"],
    });

    for (const skill of skills) {
      const canonical = await readFile(join(skill.directory, "SKILL.md"));
      for (const destination of [
        join(root, ".cursor", "skills", skill.name),
        join(root, ".github", "skills", skill.name),
      ]) {
        expect(await readFile(join(destination, "SKILL.md"))).toEqual(
          canonical,
        );
        expect(await exists(join(destination, "agents", "openai.yaml"))).toBe(
          false,
        );
      }
    }

    const clientFirst = skills.find(
      (skill) => skill.name === "build-webflow-with-client-first",
    );
    expect(clientFirst).toBeDefined();
    const references = await readdir(
      join(clientFirst!.directory, "references"),
    );
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) {
      const canonical = await readFile(
        join(clientFirst!.directory, "references", reference),
      );
      expect(
        await readFile(
          join(
            root,
            ".cursor",
            "skills",
            clientFirst!.name,
            "references",
            reference,
          ),
        ),
      ).toEqual(canonical);
      expect(
        await readFile(
          join(
            root,
            ".github",
            "skills",
            clientFirst!.name,
            "references",
            reference,
          ),
        ),
      ).toEqual(canonical);
    }

    expect(
      await exists(
        join(
          root,
          ".cursor",
          "skills",
          "configure-agent-user-profile",
          "SKILL.md",
        ),
      ),
    ).toBe(true);
    expect(
      await exists(
        join(
          root,
          ".github",
          "skills",
          "configure-agent-user-profile",
          "SKILL.md",
        ),
      ),
    ).toBe(true);
    expect(
      manifest.files.some(
        (file) =>
          (file.startsWith(".cursor/skills/") ||
            file.startsWith(".github/skills/")) &&
          file.endsWith(".yaml"),
      ),
    ).toBe(false);
    await expect(validateAdapters(root)).resolves.toMatchObject({
      ok: true,
      checkedSkills: 24,
    });
  });

  it("keeps the private profile outside generated ownership and Webflow exports", async () => {
    const root = await temporaryProject(
      "slicemedia-agent-kit-private-profile-",
    );
    await seedProject(root);
    const profilePath = join(
      root,
      ".slicemedia",
      "agent-kit",
      "user-profile.local.md",
    );
    const profile = "# Local profile\n\n- Preferred language: German\n";
    await mkdir(dirname(profilePath), { recursive: true });
    await writeFile(profilePath, profile);

    const manifest = await generateAdapters(root, {
      profile: "project",
      targets: ADAPTER_TARGETS,
    });
    expect(manifest.files).not.toContain(
      ".slicemedia/agent-kit/user-profile.local.md",
    );
    expect(Object.keys(manifest.digests)).not.toContain(
      ".slicemedia/agent-kit/user-profile.local.md",
    );
    expect(await readFile(profilePath, "utf8")).toBe(profile);

    const claudeSkillPath = join(
      root,
      ".claude",
      "skills",
      "configure-agent-user-profile",
    );
    expect(await exists(join(claudeSkillPath, "SKILL.md"))).toBe(true);
    expect(await exists(join(claudeSkillPath, "agents", "openai.yaml"))).toBe(
      false,
    );
    const claudeClientFirstPath = join(
      root,
      ".claude",
      "skills",
      "build-webflow-with-client-first",
    );
    expect(
      await readFile(
        join(
          claudeClientFirstPath,
          "references",
          "client-first-conventions.md",
        ),
        "utf8",
      ),
    ).toContain("Client-First 2.1");
    expect(
      await exists(join(claudeClientFirstPath, "agents", "openai.yaml")),
    ).toBe(false);
    expect(
      await exists(
        join(
          root,
          ".cursor",
          "skills",
          "configure-agent-user-profile",
          "SKILL.md",
        ),
      ),
    ).toBe(true);
    expect(
      await exists(
        join(
          root,
          ".github",
          "skills",
          "configure-agent-user-profile",
          "SKILL.md",
        ),
      ),
    ).toBe(true);
    expect(
      await readFile(join(root, ".github", "copilot-instructions.md"), "utf8"),
    ).toContain("user-profile.local.md");
    expect(await readFile(join(root, "CLAUDE.md"), "utf8")).toContain(
      "Editor-facing handoff",
    );
    expect(
      await readFile(
        join(root, ".cursor", "rules", "00-foundation.mdc"),
        "utf8",
      ),
    ).toContain("Editor-facing handoff");
    expect(
      await readFile(join(root, ".github", "copilot-instructions.md"), "utf8"),
    ).toContain("Editor-facing handoff");

    const regenerated = await generateAdapters(root, {
      profile: "project",
      targets: ["webflow"],
      force: true,
    });
    expect(regenerated.files).not.toContain(
      ".slicemedia/agent-kit/user-profile.local.md",
    );
    expect(await readFile(profilePath, "utf8")).toBe(profile);
    const archiveEntries = Object.keys(
      unzipSync(
        await readFile(
          join(
            root,
            ".slicemedia",
            "agent-kit",
            "webflow-agent-instructions.zip",
          ),
        ),
      ),
    );
    expect(archiveEntries.some((entry) => entry.includes("user-profile"))).toBe(
      false,
    );
    expect(
      archiveEntries.some((entry) =>
        entry.startsWith("skills/test-webflow-local-development/"),
      ),
    ).toBe(false);
  });

  it("never adopts a private profile claimed by a prior manifest", async () => {
    const root = await temporaryProject(
      "slicemedia-agent-kit-reserved-profile-",
    );
    await seedProject(root);
    const relativeProfile = ".slicemedia/agent-kit/user-profile.local.md";
    const profilePath = join(root, relativeProfile);
    const profile = "# Private profile\n\n- Preferred language: de\n";
    await mkdir(dirname(profilePath), { recursive: true });
    await writeFile(profilePath, profile);

    const initial = await generateAdapters(root, { targets: [] });
    const manifestPath = join(
      root,
      ".slicemedia",
      "agent-kit",
      "agent-adapters.json",
    );
    const digest = createHash("sha256").update(profile).digest("hex");
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          ...initial,
          files: [relativeProfile],
          digests: { [relativeProfile]: digest },
        },
        null,
        2,
      )}\n`,
    );

    await generateAdapters(root, { targets: [] });
    expect(await readFile(profilePath, "utf8")).toBe(profile);

    const caseVariant = ".slicemedia/agent-kit/User-Profile.Local.md";
    await writeFile(
      manifestPath,
      `${JSON.stringify(
        {
          ...initial,
          files: [caseVariant],
          digests: { [caseVariant]: digest },
        },
        null,
        2,
      )}\n`,
    );
    const regenerated = await generateAdapters(root, {
      targets: [],
      force: true,
    });
    expect(await readFile(profilePath, "utf8")).toBe(profile);
    expect(regenerated.files).not.toContain(relativeProfile);
    expect(regenerated.files).not.toContain(caseVariant);
  });

  it.each(ADAPTER_TARGETS)("isolates the %s target", async (target) => {
    const root = await temporaryProject(`slicemedia-agent-kit-${target}-`);
    await seedProject(root);
    const manifest = await generateAdapters(root, {
      profile: "project",
      targets: [target],
    });

    expect(manifest.adapters).toEqual([target]);
    for (const other of ADAPTER_TARGETS) {
      if (other === target) continue;
      const prefixes: Record<(typeof ADAPTER_TARGETS)[number], string[]> = {
        codex: ["AGENTS.md", ".agents/"],
        claude: ["CLAUDE.md", ".claude/"],
        cursor: [".cursor/"],
        copilot: [
          ".github/copilot-instructions.md",
          ".github/instructions/",
          ".github/skills/",
        ],
        webflow: [".slicemedia/agent-kit/webflow-agent-instructions.zip"],
      };
      expect(
        manifest.files.some((file) =>
          prefixes[other].some((prefix) => file.startsWith(prefix)),
        ),
      ).toBe(false);
    }
    await expect(validateAdapters(root)).resolves.toMatchObject({ ok: true });
  });

  it("can generate a project guide without platform-specific adapters", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-guide-");
    await seedProject(root);
    const manifest = await generateAdapters(root, {
      profile: "project",
      targets: [],
    });

    expect(manifest.adapters).toEqual([]);
    expect(await readFile(join(root, "WEBFLOW_PROJECT.md"), "utf8")).toContain(
      "Webflow project guidance",
    );
    expect(await exists(join(root, "AGENTS.md"))).toBe(false);
    await expect(validateAdapters(root)).resolves.toMatchObject({ ok: true });
  });

  it("requires explicit targets for project generation", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-explicit-");
    await seedProject(root);
    await expect(generateAdapters(root)).rejects.toThrow(
      "explicit targets array",
    );
  });

  it("preserves an existing project-owned guide without adopting it", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-project-guide-");
    await seedProject(root);
    const projectGuide =
      "# Project-owned guidance\n\nKeep this exact content.\n";
    await writeFile(join(root, "WEBFLOW_PROJECT.md"), projectGuide);

    const manifest = await generateAdapters(root, { targets: ["codex"] });
    expect(await readFile(join(root, "WEBFLOW_PROJECT.md"), "utf8")).toBe(
      projectGuide,
    );
    expect(manifest.projectGuide).toBe("WEBFLOW_PROJECT.md");
    expect(manifest.files).not.toContain("WEBFLOW_PROJECT.md");

    await generateAdapters(root, { targets: ["claude"] });
    expect(await readFile(join(root, "WEBFLOW_PROJECT.md"), "utf8")).toBe(
      projectGuide,
    );
  });

  it("removes only unchanged files owned by the previous generation", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-regenerate-");
    await seedProject(root);
    await generateAdapters(root, { targets: ["codex"] });
    await writeFile(join(root, ".agents", "notes.md"), "user-owned\n");

    const manifest = await generateAdapters(root, { targets: ["claude"] });
    expect(manifest.adapters).toEqual(["claude"]);
    expect(await exists(join(root, "AGENTS.md"))).toBe(false);
    expect(await readFile(join(root, ".agents", "notes.md"), "utf8")).toBe(
      "user-owned\n",
    );
    expect(await exists(join(root, "CLAUDE.md"))).toBe(true);
  });

  it("converges from all targets to Codex while preserving unrelated files", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-converge-");
    await seedProject(root);
    await generateAdapters(root, { targets: ADAPTER_TARGETS });
    const unrelated = [
      [".agents", "notes.md"],
      [".claude", "notes.md"],
      [".cursor", "rules", "team.mdc"],
      [".cursor", "skills", "team-skill", "SKILL.md"],
      [".github", "instructions", "team.instructions.md"],
      [".github", "skills", "team-skill", "SKILL.md"],
    ];
    for (const parts of unrelated) {
      const path = join(root, ...parts);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, "user-owned\n");
    }

    const manifest = await generateAdapters(root, { targets: ["codex"] });
    expect(manifest.adapters).toEqual(["codex"]);
    expect(await exists(join(root, "AGENTS.md"))).toBe(true);
    expect(await exists(join(root, "CLAUDE.md"))).toBe(false);
    expect(
      await exists(join(root, ".cursor", "rules", "00-foundation.mdc")),
    ).toBe(false);
    expect(
      await exists(
        join(
          root,
          ".cursor",
          "skills",
          "build-webflow-with-client-first",
          "SKILL.md",
        ),
      ),
    ).toBe(false);
    expect(await exists(join(root, ".github", "copilot-instructions.md"))).toBe(
      false,
    );
    expect(
      await exists(
        join(
          root,
          ".github",
          "skills",
          "build-webflow-with-client-first",
          "SKILL.md",
        ),
      ),
    ).toBe(false);
    expect(
      await exists(
        join(
          root,
          ".slicemedia",
          "agent-kit",
          "webflow-agent-instructions.zip",
        ),
      ),
    ).toBe(false);
    for (const parts of unrelated) {
      expect(await readFile(join(root, ...parts), "utf8")).toBe("user-owned\n");
    }
    await expect(validateAdapters(root)).resolves.toMatchObject({ ok: true });
  });

  it("refuses unknown or modified adapter paths unless force is reviewed", async () => {
    const root = await temporaryProject("slicemedia-agent-kit-conflict-");
    await seedProject(root);
    await writeFile(join(root, "AGENTS.md"), "user-owned\n");

    await expect(
      generateAdapters(root, { targets: ["codex"] }),
    ).rejects.toThrow("Refusing to overwrite");
    await expect(
      generateAdapters(root, { targets: ["codex"], force: true }),
    ).resolves.toMatchObject({ adapters: ["codex"] });

    await writeFile(join(root, "AGENTS.md"), "edited after generation\n");
    await expect(
      generateAdapters(root, { targets: ["claude"] }),
    ).rejects.toThrow("Refusing to overwrite or remove");
  });
});
