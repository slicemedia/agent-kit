import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateReleaseWorkflow } from "./release-workflow-policy.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = resolve(
  repositoryRoot,
  "scripts/assert-release-preparation-safe.mjs",
);
const workflow = await readFile(
  resolve(repositoryRoot, ".github/workflows/release-pr.yml"),
  "utf8",
);
const changesetsStep =
  "      - uses: changesets/action/version@8488615a623b1b9c987934bb89eae8af6a946ac1 # v2.1.1";

function beforeChangesets(...lines) {
  return workflow.replace(
    changesetsStep,
    `${lines.join("\n")}\n${changesetsStep}`,
  );
}

function expectRejected(source) {
  expect(validateReleaseWorkflow(source)).not.toEqual([]);
}

describe("release preparation", () => {
  it("accepts the pinned version-only workflow for recognized private visibility", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "slicemedia/agent-kit",
      GITHUB_REPOSITORY_VISIBILITY: "private",
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/npm publication is disabled/u);
  });

  it("accepts the pinned version-only workflow for recognized public visibility", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "slicemedia/agent-kit",
      GITHUB_REPOSITORY_VISIBILITY: "public",
    });

    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toMatch(/npm publication is disabled/u);
  });

  it("rejects an unexpected repository", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "example/agent-kit",
      GITHUB_REPOSITORY_VISIBILITY: "private",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/restricted to slicemedia\/agent-kit/u);
  });

  it("requires an explicit recognized repository visibility", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "slicemedia/agent-kit",
      GITHUB_REPOSITORY_VISIBILITY: "internal",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/explicit private or public/u);
  });

  it("rejects npm credentials in the version-PR environment", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "slicemedia/agent-kit",
      GITHUB_REPOSITORY_VISIBILITY: "private",
      NPM_TOKEN: "fixture",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/NPM_TOKEN must not be available/u);
  });

  it("fails closed when the repository identity is missing", async () => {
    const result = await run({
      GITHUB_REPOSITORY: "",
      GITHUB_REPOSITORY_VISIBILITY: "private",
    });

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/restricted to slicemedia\/agent-kit/u);
  });
});

describe("release workflow structural policy", () => {
  it("accepts only the reviewed canonical workflow", () => {
    expect(validateReleaseWorkflow(workflow)).toEqual([]);
  });

  it("rejects ordinary block-style extra uses and run steps", () => {
    expectRejected(
      beforeChangesets(
        "      - uses: actions/setup-node@1111111111111111111111111111111111111111",
        "      - run: echo unreviewed-standard-step",
      ),
    );
  });

  it("rejects flow-style extra uses and run steps", () => {
    expectRejected(
      beforeChangesets(
        "      - { uses: actions/setup-node@1111111111111111111111111111111111111111, with: { node-version: 22 } }",
        '      - { run: "echo unreviewed-flow-step" }',
      ),
    );
  });

  it("rejects multiline run syntax even when it resolves to an allowed command", () => {
    expectRejected(
      workflow.replace(
        "      - run: pnpm install --frozen-lockfile",
        "      - run: |-\n          pnpm install --frozen-lockfile",
      ),
    );
  });

  it("rejects a job-level reusable workflow", () => {
    expectRejected(
      `${workflow}\n  unexpected:\n    uses: example/release/.github/workflows/publish.yml@1111111111111111111111111111111111111111\n`,
    );
  });

  it("requires the explicit repository-variable enablement gate", () => {
    expectRejected(
      workflow.replace(" && vars.SLICEMEDIA_RELEASE_PR_ENABLED == 'true'", ""),
    );
  });

  it("does not allow manual dispatch of the write-capable version job", () => {
    expectRejected(
      workflow.replace(
        "  push:\n    branches: [main]",
        "  push:\n    branches: [main]\n  workflow_dispatch:",
      ),
    );
  });

  it.each([
    [
      "trigger",
      (source) => source.replace("branches: [main]", "branches: [release]"),
    ],
    [
      "root permissions",
      (source) =>
        source.replace("permissions: {}", "permissions:\n  contents: read"),
    ],
    [
      "concurrency",
      (source) =>
        source.replace("cancel-in-progress: false", "cancel-in-progress: true"),
    ],
    [
      "job permissions",
      (source) =>
        source.replace("      contents: write", "      contents: read"),
    ],
    [
      "step order",
      (source) =>
        source.replace(
          "      - run: pnpm install --frozen-lockfile\n      - run: pnpm release:prepare:check",
          "      - run: pnpm release:prepare:check\n      - run: pnpm install --frozen-lockfile",
        ),
    ],
    [
      "action pin",
      (source) =>
        source.replace(
          "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
          "actions/checkout@1111111111111111111111111111111111111111",
        ),
    ],
    [
      "action inputs",
      (source) =>
        source.replace("          cache: true", "          cache: false"),
    ],
    [
      "guard environment",
      (source) =>
        source.replace(
          "${{ github.event.repository.visibility }}",
          "${{ vars.REPOSITORY_VISIBILITY }}",
        ),
    ],
    [
      "private release denylist",
      (source) =>
        source.replace(
          "${{ secrets.SLICEMEDIA_FORBIDDEN_TERMS }}",
          "${{ vars.SLICEMEDIA_FORBIDDEN_TERMS }}",
        ),
    ],
    [
      "protected release-sanitize environment",
      (source) => source.replace("    environment: release-sanitize\n", ""),
    ],
    [
      "Changesets subaction input",
      (source) =>
        source.replace(
          "          script: pnpm version-packages",
          "          version-script: pnpm version-packages",
        ),
    ],
  ])("rejects a changed %s contract", (_label, mutate) => {
    expectRejected(mutate(workflow));
  });

  it.each([
    ["npm publish", "npm publish"],
    ["Changesets publish", "pnpm changeset publish"],
    ["Git tag", "git tag v0.2.0"],
    ["GitHub Release", "gh release create v0.2.0"],
  ])("rejects a %s command path", (_label, command) => {
    expectRejected(workflow.replace("pnpm install --frozen-lockfile", command));
  });

  it("rejects OIDC and npm credential paths", () => {
    expectRejected(
      workflow.replace("permissions: {}", "permissions:\n  id-token: write"),
    );
    expectRejected(
      workflow.replace(
        "      - run: pnpm install --frozen-lockfile",
        "      - run: pnpm install --frozen-lockfile\n        env:\n          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}",
      ),
    );
  });
});

function run(additionalEnvironment) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [script], {
      cwd: repositoryRoot,
      env: {
        ...process.env,
        NODE_AUTH_TOKEN: "",
        NPM_TOKEN: "",
        ...additionalEnvironment,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", rejectPromise);
    child.once("exit", (code) => resolvePromise({ code, stderr, stdout }));
  });
}
