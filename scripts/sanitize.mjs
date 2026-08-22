import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ignored = new Set([
  ".git",
  ".private",
  ".slicemedia",
  "coverage",
  "node_modules",
]);
const localDenylistPath = ".private/denylist.txt";
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /(?:access|api|auth|secret)[_-]?key\s*[=:]\s*["'][A-Za-z0-9_./+=-]{16,}["']/iu,
  /(?:password|token)\s*[=:]\s*["'][^"']{12,}["']/iu,
];

function parseConfiguredTerms(value) {
  if (value === undefined || value.trim() === "") return [];
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(
      "SLICEMEDIA_FORBIDDEN_TERMS must be a valid JSON array of strings.",
    );
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every((term) => typeof term === "string")
  ) {
    throw new Error(
      "SLICEMEDIA_FORBIDDEN_TERMS must be a valid JSON array of strings.",
    );
  }
  return parsed;
}

function normalizeTerms(terms) {
  const unique = new Map();
  for (const value of terms) {
    const term = value.trim();
    if (term === "") continue;
    const key = term.toLocaleLowerCase("en-US");
    if (!unique.has(key)) unique.set(key, term);
  }
  return [...unique.values()];
}

function privateTermRules(terms) {
  return terms.flatMap((term, termIndex) => {
    const caseVariants = [];
    const seenVariants = new Set();
    for (const [kind, value] of [
      ["exact", term],
      ["lowercase", term.toLocaleLowerCase("en-US")],
      ["uppercase", term.toLocaleUpperCase("en-US")],
    ]) {
      if (!seenVariants.has(value)) {
        seenVariants.add(value);
        caseVariants.push({ kind, value });
      }
    }
    return [
      {
        termIndex: termIndex + 1,
        kind: "plain",
        value: term,
        caseInsensitive: true,
      },
      ...caseVariants.flatMap((variant) => {
        const suffix = variant.kind === "exact" ? "" : `-${variant.kind}`;
        const bytes = Buffer.from(variant.value, "utf8");
        return [
          {
            termIndex: termIndex + 1,
            kind: `base64${suffix}`,
            value: bytes.toString("base64"),
            caseInsensitive: false,
          },
          {
            termIndex: termIndex + 1,
            kind: `hex${suffix}`,
            value: bytes.toString("hex"),
            caseInsensitive: true,
          },
        ];
      }),
    ];
  });
}

async function readLocalTerms(root) {
  try {
    const source = await readFile(resolve(root, localDenylistPath), "utf8");
    return source
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line !== "" && !line.startsWith("#"));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export async function privateForbiddenTerms(
  rootDirectory,
  environment = process.env,
) {
  const required = environment.SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS;
  if (
    required !== undefined &&
    required !== "" &&
    required !== "true" &&
    required !== "false"
  ) {
    throw new Error(
      "SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS must equal true or false when set.",
    );
  }
  const terms = normalizeTerms([
    ...parseConfiguredTerms(environment.SLICEMEDIA_FORBIDDEN_TERMS),
    ...(await readLocalTerms(resolve(rootDirectory))),
  ]);
  if (required === "true" && terms.length === 0) {
    throw new Error(
      "Private forbidden-term configuration is required for this sanitization gate.",
    );
  }
  return terms;
}

function matchingPrivateRules(source, rules) {
  const normalized = source.toLocaleLowerCase("en-US");
  return rules.filter((rule) =>
    rule.caseInsensitive
      ? normalized.includes(rule.value.toLocaleLowerCase("en-US"))
      : source.includes(rule.value),
  );
}

function redactPrivateRules(source, rules) {
  let redacted = source;
  for (const rule of [...rules].sort(
    (left, right) => right.value.length - left.value.length,
  )) {
    const escaped = rule.value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
    redacted = redacted.replace(
      new RegExp(escaped, rule.caseInsensitive ? "giu" : "gu"),
      "[redacted]",
    );
  }
  return redacted;
}

export async function sanitizeDirectory(
  rootDirectory,
  environment = process.env,
) {
  const root = resolve(rootDirectory);
  const forbiddenTerms = await privateForbiddenTerms(root, environment);
  const privateRules = privateTermRules(forbiddenTerms);
  const errors = [];

  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && ignored.has(entry.name)) continue;
      const path = resolve(directory, entry.name);
      const display = relative(root, path).replaceAll("\\", "/");
      const privatePathRules = matchingPrivateRules(display, privateRules);
      const redactedDisplay = redactPrivateRules(display, privateRules);
      for (const rule of privatePathRules) {
        errors.push(
          `Forbidden private term rule ${rule.termIndex}/${rule.kind} in path: ${redactedDisplay}`,
        );
      }
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }
      const source = (await readFile(path)).toString("utf8");
      for (const rule of matchingPrivateRules(source, privateRules)) {
        errors.push(
          `Forbidden private term rule ${rule.termIndex}/${rule.kind} in file: ${redactedDisplay}`,
        );
      }
      for (const pattern of secretPatterns) {
        if (pattern.test(source))
          errors.push(`Possible secret in file: ${display}`);
      }
    }
  }

  await visit(root);
  return [
    ...new Set(errors.map((error) => redactPrivateRules(error, privateRules))),
  ];
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  try {
    const errors = await sanitizeDirectory(process.cwd());
    if (errors.length > 0) {
      console.error(errors.join("\n"));
      process.exitCode = 1;
    } else {
      console.info("Sanitization passed.");
    }
  } catch {
    console.error("Sanitization could not complete safely.");
    process.exitCode = 1;
  }
}
