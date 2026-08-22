import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

import {
  inspectCurrentMain,
  validatePublishNextPreflight,
  validatePublishNextWorkflow,
  validateReleaseCommitState,
} from "./publish-next-workflow-policy.mjs";

const run = promisify(execFile);
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function runGit(arguments_) {
  const result = await run("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  });
  return result.stdout;
}

export async function inspectPublishNextSafety(environment = process.env) {
  const errors = [];
  let manifest;
  let workflow;
  let npmVersion;
  try {
    [manifest, workflow, npmVersion] = await Promise.all([
      readFile(resolve(repositoryRoot, "package.json"), "utf8").then(
        JSON.parse,
      ),
      readFile(
        resolve(repositoryRoot, ".github/workflows/publish-next.yml"),
        "utf8",
      ),
      run("npm", ["--version"], { encoding: "utf8" }).then(({ stdout }) =>
        stdout.trim(),
      ),
    ]);
  } catch (error) {
    return [
      `Unable to read publication inputs: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }

  errors.push(
    ...validatePublishNextWorkflow(workflow),
    ...validatePublishNextPreflight(manifest, environment, npmVersion),
  );
  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor !== 24) {
    errors.push(
      `Trusted publication requires Node >=24 <25; received ${process.versions.node}.`,
    );
  }

  try {
    const state = await inspectCurrentMain(runGit);
    errors.push(
      ...validateReleaseCommitState(
        environment.SLICEMEDIA_RELEASE_COMMIT ?? "",
        state,
      ),
    );
  } catch (error) {
    errors.push(
      `Unable to verify the current publication checkout: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return errors;
}

export async function assertPublishNextSafe(environment = process.env) {
  const errors = await inspectPublishNextSafety(environment);
  if (errors.length > 0) throw new Error(errors.join("\n"));
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isEntrypoint) {
  try {
    await assertPublishNextSafe();
    console.info(
      "Unprivileged npm next preparation is approved for the exact current main commit.",
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
