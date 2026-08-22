import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateReleaseWorkflow } from "./release-workflow-policy.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedRepository = "slicemedia/agent-kit";
const prohibitedCredentialVariables = ["NODE_AUTH_TOKEN", "NPM_TOKEN"];
const errors = [];
const visibility = process.env.GITHUB_REPOSITORY_VISIBILITY;
if (visibility !== "private" && visibility !== "public") {
  errors.push(
    `Release preparation requires an explicit private or public repository visibility; received ${JSON.stringify(visibility)}.`,
  );
}
if (process.env.GITHUB_REPOSITORY !== expectedRepository) {
  errors.push(`Release preparation is restricted to ${expectedRepository}.`);
}
for (const variable of prohibitedCredentialVariables) {
  if (process.env[variable]?.trim()) {
    errors.push(
      `${variable} must not be available to the version-PR workflow.`,
    );
  }
}

const manifest = JSON.parse(
  await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
);
if (manifest.name !== "@slicemedia/agent-kit") {
  errors.push("Release preparation is restricted to the Agent Kit package.");
}
if (manifest.private !== true && manifest.private !== false) {
  errors.push(
    "@slicemedia/agent-kit must declare an explicit private boolean.",
  );
}

const workflow = await readFile(
  resolve(repositoryRoot, ".github/workflows/release-pr.yml"),
  "utf8",
);
errors.push(...validateReleaseWorkflow(workflow));

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.info(
    "Version-PR release preparation is fail-closed; npm publication is disabled.",
  );
}
