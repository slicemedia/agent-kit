import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { sanitizeDirectory } from "./sanitize.mjs";

const run = promisify(execFile);
const sanitizer = fileURLToPath(new URL("./sanitize.mjs", import.meta.url));

async function runSanitizer(root, environment) {
  try {
    const result = await run(process.execPath, [sanitizer], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...environment },
    });
    return { code: 0, stderr: result.stderr, stdout: result.stdout };
  } catch (error) {
    return {
      code: error?.code,
      stderr: String(error?.stderr ?? ""),
      stdout: String(error?.stdout ?? ""),
    };
  }
}

describe("repository sanitization", () => {
  it("loads private terms from JSON without exposing their values", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-private-sanitize-"));
    const privateTerm = `fixture-${randomUUID()}-ä`;

    try {
      await writeFile(
        join(root, `${privateTerm}.txt`),
        `Private marker: ${privateTerm}\n`,
      );
      const errors = await sanitizeDirectory(root, {
        SLICEMEDIA_FORBIDDEN_TERMS: JSON.stringify([privateTerm]),
      });

      expect(errors).toEqual(
        expect.arrayContaining([
          expect.stringContaining("rule 1/plain in path"),
          expect.stringContaining("rule 1/plain in file"),
        ]),
      );
      expect(errors.join("\n")).toContain("[redacted]");
      expect(errors.join("\n")).not.toContain(privateTerm);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("derives exact UTF-8 base64 and hex rules at runtime", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-encoded-sanitize-"));
    const privateTerm = `fixture-${randomUUID()}-ä`;
    const encodedBase64 = Buffer.from(privateTerm, "utf8").toString("base64");
    const encodedUppercaseBase64 = Buffer.from(
      privateTerm.toLocaleUpperCase("en-US"),
      "utf8",
    ).toString("base64");
    const encodedHex = Buffer.from(privateTerm, "utf8")
      .toString("hex")
      .toUpperCase();

    try {
      await writeFile(
        join(root, `${encodedHex}.txt`),
        `${encodedBase64}\n${encodedUppercaseBase64}\n${encodedHex}\n`,
      );
      const errors = await sanitizeDirectory(root, {
        SLICEMEDIA_FORBIDDEN_TERMS: JSON.stringify([privateTerm]),
      });
      const output = errors.join("\n");

      expect(output).toContain("rule 1/base64 in file");
      expect(output).toContain("rule 1/base64-uppercase in file");
      expect(output).toContain("rule 1/hex in file");
      expect(output).toContain("rule 1/hex in path");
      expect(output).toContain("[redacted]");
      expect(output).not.toContain(privateTerm);
      expect(output).not.toContain(encodedBase64);
      expect(output).not.toContain(encodedUppercaseBase64);
      expect(output).not.toContain(encodedHex);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("supports an ignored local private denylist", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-local-sanitize-"));
    const privateTerm = `fixture-${randomUUID()}`;

    try {
      await mkdir(join(root, ".private"));
      await writeFile(
        join(root, ".private", "denylist.txt"),
        `# Local configuration\n${privateTerm}\n`,
      );
      await writeFile(join(root, "source.txt"), privateTerm);
      const errors = await sanitizeDirectory(root, {});

      expect(errors.join("\n")).toContain("rule 1/plain in file");
      expect(errors.join("\n")).not.toContain(privateTerm);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("fails closed when a required private configuration is missing", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-required-sanitize-"));

    try {
      await expect(
        sanitizeDirectory(root, {
          SLICEMEDIA_FORBIDDEN_TERMS: "[]",
          SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true",
        }),
      ).rejects.toThrow(/configuration is required/u);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("rejects invalid private-term JSON without echoing it", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-invalid-sanitize-"));
    const invalidMarker = randomUUID();

    try {
      await expect(
        sanitizeDirectory(root, {
          SLICEMEDIA_FORBIDDEN_TERMS: `{${invalidMarker}`,
        }),
      ).rejects.not.toThrow(invalidMarker);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("keeps configured values out of command output", async () => {
    const root = await mkdtemp(join(tmpdir(), "agent-kit-output-sanitize-"));
    const privateTerm = `fixture-${randomUUID()}`;

    try {
      await writeFile(join(root, `${privateTerm}.txt`), privateTerm);
      const result = await runSanitizer(root, {
        SLICEMEDIA_FORBIDDEN_TERMS: JSON.stringify([privateTerm]),
        SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true",
      });
      const output = `${result.stdout}\n${result.stderr}`;

      expect(result.code).toBe(1);
      expect(output).toContain("rule 1/plain");
      expect(output).toContain("[redacted]");
      expect(output).not.toContain(privateTerm);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });
});
