import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateCiWorkflow } from "./ci-workflow-policy.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const workflow = await readFile(
  resolve(repositoryRoot, ".github/workflows/ci.yml"),
  "utf8",
);

describe("cross-platform CI workflow policy", () => {
  it("accepts the exact Linux/Windows and Node 22/24 matrix", () => {
    expect(validateCiWorkflow(workflow)).toEqual([]);
  });

  it.each([
    ["Windows", (source) => source.replace(", windows-latest", "")],
    ["Node 22.13 floor", (source) => source.replace("22.13.0, ", "")],
    ["Node 24", (source) => source.replace(", 24", "")],
    [
      "immutable checkout pin",
      (source) =>
        source.replace(
          "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
          "actions/checkout@1111111111111111111111111111111111111111",
        ),
    ],
    [
      "credential isolation",
      (source) =>
        source.replace(
          "persist-credentials: false",
          "persist-credentials: true",
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
      "required private release denylist gate",
      (source) =>
        source.replace(
          '          SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true"\n',
          "",
        ),
    ],
    [
      "push-main-only secret routing",
      (source) => source.replace("github.event_name == 'push' && ", ""),
    ],
    [
      "protected release-sanitize environment",
      (source) => source.replace("    environment: release-sanitize\n", ""),
    ],
  ])("rejects removal or mutation of %s coverage", (_label, mutate) => {
    expect(validateCiWorkflow(mutate(workflow))).not.toEqual([]);
  });

  it("keeps the private release denylist out of generic pull-request code", () => {
    const parsed = workflow.split("  private-release-denylist:")[0];
    expect(parsed).not.toContain("SLICEMEDIA_FORBIDDEN_TERMS");
    expect(workflow).not.toContain("id-token: write");
  });
});
