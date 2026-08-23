import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { parseDocument } from "yaml";

import { archiveIntegrity } from "./publish-next.mjs";
import {
  inspectCurrentMain,
  validatePublishNextPreflight,
  validatePublishNextWorkflow,
  validateReleaseCommitState,
} from "./publish-next-workflow-policy.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = await readFile(
  resolve(repositoryRoot, ".github/workflows/publish-next.yml"),
  "utf8",
);
const parsedWorkflow = parseDocument(workflow).toJS();
const publisher = await readFile(
  resolve(repositoryRoot, "scripts/publish-next.mjs"),
  "utf8",
);
const manifest = JSON.parse(
  await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
);
const publicManifest = { ...manifest, private: false };
const privateManifest = { ...manifest, private: true };
const commit = "a".repeat(40);
const publicEnvironment = {
  GITHUB_REPOSITORY: "slicemedia/agent-kit",
  GITHUB_REPOSITORY_VISIBILITY: "public",
  GITHUB_REF: "refs/heads/main",
  GITHUB_SHA: commit,
  GITHUB_EVENT_NAME: "workflow_dispatch",
  GITHUB_ACTIONS: "true",
  SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED: "true",
  SLICEMEDIA_RELEASE_COMMIT: commit,
};
const liveCheckLine = workflow
  .split("\n")
  .find((line) => line.includes("git ls-remote --exit-code origin"));

function expectRejected(source) {
  expect(validatePublishNextWorkflow(source)).not.toEqual([]);
}

describe("publish-next workflow structural policy", () => {
  it("accepts only the reviewed privilege-separated workflow", () => {
    expect(validatePublishNextWorkflow(workflow)).toEqual([]);
    expect(liveCheckLine).toBeDefined();
    expect(workflow.match(/git ls-remote --exit-code origin/gmu)).toHaveLength(
      2,
    );

    const prepareSteps = parsedWorkflow.jobs.prepare.steps;
    const npmInstallIndex = prepareSteps.findIndex(
      (step) =>
        step.run ===
        "npm install --global npm@11.19.0 --ignore-scripts --registry=https://registry.npmjs.org/ --userconfig=/dev/null",
    );
    expect(prepareSteps[npmInstallIndex + 1]).toMatchObject({
      name: "Prefer reviewed npm CLI",
      shell: "bash",
    });
    expect(prepareSteps[npmInstallIndex + 1].run).toContain(
      'npm_global_prefix="$(npm prefix -g)"',
    );
  });

  it("fails closed unless the reviewed npm path proof remains complete", () => {
    const mutations = [
      ['"$npm_global_prefix" != /* || ', ""],
      ['"$npm_global_prefix" == *:* || ', ""],
      ["\"$npm_global_prefix\" == *$'\\n'* || ", ""],
      [" || \"$npm_global_prefix\" == *$'\\r'*", ""],
      [
        'npm_global_bin="${npm_global_prefix%/}/bin"',
        'npm_global_bin="${npm_global_prefix}/bin"',
      ],
      ['! -d "$npm_global_bin"', '! -e "$npm_global_bin"'],
      ['! -x "$npm_global_bin/npm"', '! -e "$npm_global_bin/npm"'],
      ['export PATH="$npm_global_bin:$PATH"', 'export PATH="$PATH"'],
      ['"$(command -v npm)" != "$npm_global_bin/npm" || ', ""],
      ['"$(npm --version)" != "11.19.0"', '"11.19.0" != "11.19.0"'],
      ['-z "${GITHUB_PATH:-}" || ', ""],
      ['"$GITHUB_PATH" != /* || ', ""],
      ["\"$GITHUB_PATH\" == *$'\\n'* || ", ""],
      [" || \"$GITHUB_PATH\" == *$'\\r'*", ""],
      [
        'printf \'%s\\n\' "$npm_global_bin" >> "$GITHUB_PATH"',
        'printf \'%s\\n\' "$PATH" >> "$GITHUB_PATH"',
      ],
    ];

    for (const [reviewed, weakened] of mutations) {
      const mutated = workflow.replace(reviewed, weakened);
      expect(mutated).not.toBe(workflow);
      expectRejected(mutated);
    }
  });

  it("keeps repository code and private scanning out of the OIDC job", () => {
    const { prepare, publish, verify } = parsedWorkflow.jobs;
    expect(prepare.environment).toBe("release-sanitize");
    expect(prepare.permissions).toEqual({ contents: "read" });
    expect(JSON.stringify(prepare)).not.toContain("id-token");
    expect(JSON.stringify(prepare)).toContain(
      "secrets.SLICEMEDIA_FORBIDDEN_TERMS",
    );

    expect(publish.environment).toBe("npm-next");
    expect(publish.permissions).toEqual({ "id-token": "write" });
    expect(JSON.stringify(publish)).not.toContain("actions/checkout");
    expect(JSON.stringify(publish)).not.toContain("pnpm install");
    expect(JSON.stringify(publish)).not.toContain("scripts/");
    expect(JSON.stringify(publish)).not.toContain("secrets.");
    expect(JSON.stringify(publish)).not.toContain(
      "SLICEMEDIA_FORBIDDEN_TERMS: ${{",
    );

    expect(verify.environment).toBeUndefined();
    expect(verify["timeout-minutes"]).toBe(25);
    expect(verify.permissions).toEqual({ contents: "read" });
    expect(JSON.stringify(verify)).not.toContain("id-token");
    expect(JSON.stringify(verify)).not.toContain("secrets.");
  });

  it.each([
    [
      "public repository gate",
      (source) =>
        source.replace("github.event.repository.private == false && ", ""),
    ],
    [
      "main dispatch gate",
      (source) => source.replace("github.ref == 'refs/heads/main' && ", ""),
    ],
    [
      "enablement variable",
      (source) =>
        source.replace(
          " && vars.SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED == 'true'",
          "",
        ),
    ],
    [
      "required full-commit input",
      (source) =>
        source.replace("        required: true", "        required: false"),
    ],
    [
      "exact checkout",
      (source) =>
        source.replace(
          "          ref: ${{ inputs.release_commit }}",
          "          ref: main",
        ),
    ],
    [
      "full checkout history",
      (source) =>
        source.replace("          fetch-depth: 0", "          fetch-depth: 1"),
    ],
    [
      "private scanning environment",
      (source) => source.replace("    environment: release-sanitize\n", ""),
    ],
    [
      "publication approval environment",
      (source) => source.replace("    environment: npm-next\n", ""),
    ],
    [
      "isolated OIDC",
      (source) =>
        source.replace("      id-token: write", "      id-token: read"),
    ],
    [
      "reviewed npm CLI",
      (source) => source.replace("npm@11.19.0", "npm@latest"),
    ],
    [
      "first live-main check",
      (source) => source.replace(`${liveCheckLine}\n`, ""),
    ],
    [
      "live GitHub lookup",
      (source) =>
        source.replace("git ls-remote --exit-code origin", "git rev-parse"),
    ],
    [
      "fixed archive pack step",
      (source) => source.replace("      - run: pnpm release:pack-next\n", ""),
    ],
    [
      "private release denylist requirement",
      (source) =>
        source.replace(
          '          SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true"\n',
          "",
        ),
    ],
    [
      "private release denylist secret",
      (source) =>
        source.replace(
          "          SLICEMEDIA_FORBIDDEN_TERMS: ${{ secrets.SLICEMEDIA_FORBIDDEN_TERMS }}\n",
          "",
        ),
    ],
    [
      "second freshness check",
      (source) => {
        const first = source.indexOf(liveCheckLine);
        const second = source.indexOf(liveCheckLine, first + 1);
        return `${source.slice(0, second)}${source.slice(second + liveCheckLine.length + 1)}`;
      },
    ],
    [
      "immutable candidate upload",
      (source) =>
        source.replace(
          "          overwrite: false",
          "          overwrite: true",
        ),
    ],
    [
      "artifact identity binding",
      (source) =>
        source.replace(
          "          artifact-ids: ${{ needs.prepare.outputs.artifact-id }}",
          "          name: agent-kit-next-candidate",
        ),
    ],
    [
      "artifact digest algorithm binding",
      (source) =>
        source.replace(
          "sha256:${{ needs.prepare.outputs.artifact-digest }}",
          "${{ needs.prepare.outputs.artifact-digest }}",
        ),
    ],
    [
      "minimal reviewed publisher",
      (source) =>
        source.replace(
          '          const registry = "https://registry.npmjs.org/";',
          '          const registry = "https://registry.example.invalid/";',
        ),
    ],
    [
      "unprivileged registry verification",
      (source) =>
        source.replace("  verify:\n", "  verify:\n    environment: npm-next\n"),
    ],
    [
      "bounded registry verification window",
      (source) =>
        source.replace("    timeout-minutes: 25", "    timeout-minutes: 10"),
    ],
    [
      "immutable action pin",
      (source) =>
        source.replace(
          "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
          "actions/checkout@1111111111111111111111111111111111111111",
        ),
    ],
  ])("rejects removal or mutation of %s", (_label, mutate) => {
    expectRejected(mutate(workflow));
  });

  it.each([
    [
      "an additional secret context",
      "        env:\n          TOKEN: ${{ secrets.NPM_TOKEN }}",
    ],
    ["a tag command", "      - run: git tag v0.2.0"],
    ["a GitHub Release", "      - run: gh release create v0.2.0"],
    ["a direct publish step", "      - run: npm publish"],
    [
      "a reusable workflow",
      "    uses: example/publish/.github/workflows/release.yml@main",
    ],
  ])("rejects %s", (_label, addition) => {
    expectRejected(`${workflow.trimEnd()}\n${addition}\n`);
  });
});

describe("publish-next preparation policy", () => {
  it("accepts a reviewed public package in an unprivileged main dispatch", () => {
    expect(
      validatePublishNextPreflight(
        publicManifest,
        publicEnvironment,
        "11.19.0",
      ),
    ).toEqual([]);
  });

  it("keeps the reviewed repository manifest explicitly public", () => {
    expect(manifest.private).toBe(false);
    expect(
      validatePublishNextPreflight(manifest, publicEnvironment, "11.19.0"),
    ).toEqual([]);
    expect(
      validatePublishNextPreflight(
        privateManifest,
        publicEnvironment,
        "11.19.0",
      ),
    ).toContain("@slicemedia/agent-kit must explicitly set private=false.");
  });

  it.each([
    ["repository", { GITHUB_REPOSITORY: "example/agent-kit" }],
    ["visibility", { GITHUB_REPOSITORY_VISIBILITY: "private" }],
    ["branch", { GITHUB_REF: "refs/heads/release" }],
    ["event", { GITHUB_EVENT_NAME: "push" }],
    ["workflow commit", { GITHUB_SHA: "b".repeat(40) }],
    ["release commit", { SLICEMEDIA_RELEASE_COMMIT: "A".repeat(40) }],
    ["variable", { SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED: "false" }],
    [
      "OIDC",
      { ACTIONS_ID_TOKEN_REQUEST_URL: "https://actions.example.invalid/oidc" },
    ],
    ["token", { NODE_AUTH_TOKEN: "fixture" }],
    ["registry", { NPM_CONFIG_REGISTRY: "https://registry.example.invalid" }],
    ["user config", { npm_config_userconfig: "/tmp/fixture" }],
    ["private denylist", { SLICEMEDIA_FORBIDDEN_TERMS: '["fixture"]' }],
  ])("rejects an invalid %s condition", (_label, mutation) => {
    expect(
      validatePublishNextPreflight(
        publicManifest,
        { ...publicEnvironment, ...mutation },
        "11.19.0",
      ),
    ).not.toEqual([]);
  });

  it.each(["10.9.4", "11.5.1", "11.12.1", "12.0.0", "invalid"])(
    "rejects npm %s for release preparation",
    (version) => {
      expect(
        validatePublishNextPreflight(
          publicManifest,
          publicEnvironment,
          version,
        ),
      ).toContain("Release preparation requires the reviewed npm 11.19.0 CLI.");
    },
  );
});

describe("current-main release identity", () => {
  it("verifies the origin then fetches main before reading commit state", async () => {
    const calls = [];
    const state = await inspectCurrentMain(async (arguments_) => {
      calls.push(arguments_);
      if (arguments_[0] === "remote") {
        return "https://github.com/slicemedia/agent-kit.git\n";
      }
      if (arguments_[0] === "fetch") return "";
      if (arguments_.includes("HEAD^{commit}")) return `${commit}\n`;
      if (arguments_.includes("refs/remotes/origin/main^{commit}")) {
        return `${commit}\n`;
      }
      return "";
    });

    expect(calls[0]).toEqual(["remote", "get-url", "origin"]);
    expect(calls[1]).toEqual([
      "fetch",
      "--no-tags",
      "--force",
      "origin",
      "+refs/heads/main:refs/remotes/origin/main",
    ]);
    expect(state).toEqual({
      head: commit,
      main: commit,
      origin: "https://github.com/slicemedia/agent-kit.git",
      status: "",
    });
    expect(validateReleaseCommitState(commit, state)).toEqual([]);
  });

  it.each([
    [
      "requested SHA",
      "b".repeat(40),
      {
        head: commit,
        main: commit,
        origin: "https://github.com/slicemedia/agent-kit.git",
        status: "",
      },
    ],
    [
      "advanced main",
      commit,
      {
        head: commit,
        main: "b".repeat(40),
        origin: "https://github.com/slicemedia/agent-kit.git",
        status: "",
      },
    ],
    [
      "dirty tree",
      commit,
      {
        head: commit,
        main: commit,
        origin: "https://github.com/slicemedia/agent-kit.git",
        status: " M package.json\n",
      },
    ],
    [
      "unexpected origin",
      commit,
      {
        head: commit,
        main: commit,
        origin: "https://github.example.invalid/slicemedia/agent-kit.git",
        status: "",
      },
    ],
  ])("rejects a stale or unsafe %s", (_label, requested, state) => {
    expect(validateReleaseCommitState(requested, state)).not.toEqual([]);
  });
});

describe("fixed archive integrity", () => {
  it("changes when any approved archive byte changes", async () => {
    const directory = await mkdtemp(join(tmpdir(), "agent-kit-integrity-"));
    const first = join(directory, "first.tgz");
    const second = join(directory, "second.tgz");
    try {
      await writeFile(first, "approved bytes");
      await writeFile(second, "approved bytes changed");
      expect(await archiveIntegrity(first)).toMatch(/^sha512-/u);
      expect(await archiveIntegrity(first)).not.toBe(
        await archiveIntegrity(second),
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("pins npm registry, ignores scripts, and verifies registry bytes and tree", () => {
    expect(publisher).toContain(
      'const registry = "https://registry.npmjs.org/"',
    );
    expect(
      publisher.match(/"--ignore-scripts"/gu)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(publisher).toContain("await archiveIntegrity(registryArchive)");
    expect(publisher).toContain("await archiveTreeDigest(registryArchive)");
    expect(publisher).toContain(
      "const registryAvailabilityMaximumAttempts = 73;",
    );
    expect(publisher).toContain(
      "const registryAvailabilityIntervalMilliseconds = 15_000;",
    );
    expect(publisher).toContain(
      "attempt <= registryAvailabilityMaximumAttempts",
    );
    expect(publisher).toContain(
      "await delay(registryAvailabilityIntervalMilliseconds)",
    );
    expect(publisher).not.toMatch(/\bnpm\s+(?:unpublish|deprecate)\b/u);
    expect(publisher).not.toMatch(/\b(?:git\s+tag|gh\s+release)\b/u);
  });
});
