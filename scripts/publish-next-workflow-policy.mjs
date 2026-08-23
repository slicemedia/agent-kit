import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { parseDocument } from "yaml";

const checkoutAction =
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1";
const pnpmSetupAction = "pnpm/setup@84cb39b217b10273981911c288cd62326dc7c6d2";
const setupNodeAction =
  "actions/setup-node@820762786026740c76f36085b0efc47a31fe5020";
const uploadArtifactAction =
  "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02";
const downloadArtifactAction =
  "actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093";
const publisherScriptPlaceholder = "<reviewed-publisher-script>";
const publisherScriptDigest =
  "56c44e44dbe41f00b9995f8d944829374d80a80d6fd9a8fc13fc4d5a1b2bdba1";

const liveCommitCheck =
  'set -euo pipefail; [[ "${SLICEMEDIA_RELEASE_COMMIT}" =~ ^[0-9a-f]{40}$ ]]; test "${SLICEMEDIA_RELEASE_COMMIT}" = "${SLICEMEDIA_WORKFLOW_COMMIT}"; test -z "${ACTIONS_ID_TOKEN_REQUEST_URL:-}"; test -z "${ACTIONS_ID_TOKEN_REQUEST_TOKEN:-}"; test -z "${NODE_AUTH_TOKEN:-}"; test -z "${NPM_TOKEN:-}"; test -z "${YARN_NPM_AUTH_TOKEN:-}"; test -z "${NPM_CONFIG_TOKEN:-}"; test -z "${npm_config_token:-}"; test -z "${NPM_CONFIG_REGISTRY:-}"; test -z "${npm_config_registry:-}"; test -z "${NPM_CONFIG_USERCONFIG:-}"; test -z "${npm_config_userconfig:-}"; test -z "${PNPM_CONFIG_REGISTRY:-}"; test -z "${YARN_NPM_REGISTRY_SERVER:-}"; test -z "${COREPACK_NPM_REGISTRY:-}"; head_commit="$(git rev-parse --verify \'HEAD^{commit}\')"; origin_url="$(git remote get-url origin)"; case "${origin_url}" in https://github.com/slicemedia/agent-kit|https://github.com/slicemedia/agent-kit.git) ;; *) exit 1 ;; esac; remote_line="$(git ls-remote --exit-code origin refs/heads/main)"; live_main="${remote_line%%[[:space:]]*}"; live_ref="${remote_line#*$\'\\t\'}"; test "${head_commit}" = "${SLICEMEDIA_RELEASE_COMMIT}"; test "${live_main}" = "${SLICEMEDIA_RELEASE_COMMIT}"; test "${live_ref}" = refs/heads/main; test -z "$(git status --porcelain=v1 --untracked-files=all)"';
const reviewedNpmPathProof =
  'set -euo pipefail\nnpm_global_prefix="$(npm prefix -g)"\nif [[ "$npm_global_prefix" != /* || "$npm_global_prefix" == *:* || "$npm_global_prefix" == *$\'\\n\'* || "$npm_global_prefix" == *$\'\\r\'* ]]; then\n  echo "npm global prefix is not a safe absolute PATH entry" >&2\n  exit 1\nfi\nnpm_global_bin="${npm_global_prefix%/}/bin"\nif [[ ! -d "$npm_global_bin" || ! -x "$npm_global_bin/npm" ]]; then\n  echo "reviewed npm executable was not found in the global npm bin directory" >&2\n  exit 1\nfi\nexport PATH="$npm_global_bin:$PATH"\nif [[ "$(command -v npm)" != "$npm_global_bin/npm" || "$(npm --version)" != "11.19.0" ]]; then\n  echo "reviewed npm 11.19.0 is not first on PATH" >&2\n  exit 1\nfi\nif [[ -z "${GITHUB_PATH:-}" || "$GITHUB_PATH" != /* || "$GITHUB_PATH" == *$\'\\n\'* || "$GITHUB_PATH" == *$\'\\r\'* ]]; then\n  echo "GITHUB_PATH is not a safe absolute command-file path" >&2\n  exit 1\nfi\nprintf \'%s\\n\' "$npm_global_bin" >> "$GITHUB_PATH"\n';

const liveCommitCheckStep = {
  run: liveCommitCheck,
  shell: "bash",
  env: {
    SLICEMEDIA_RELEASE_COMMIT: "${{ inputs.release_commit }}",
    SLICEMEDIA_WORKFLOW_COMMIT: "${{ github.sha }}",
  },
};

const preparationEnvironment = {
  GITHUB_REPOSITORY_VISIBILITY: "${{ github.event.repository.visibility }}",
  SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED:
    "${{ vars.SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED }}",
  SLICEMEDIA_RELEASE_COMMIT: "${{ inputs.release_commit }}",
};

const expectedWorkflow = {
  name: "Publish npm prerelease",
  on: {
    workflow_dispatch: {
      inputs: {
        release_commit: {
          description: "Full 40-character main commit to publish",
          required: true,
          type: "string",
        },
      },
    },
  },
  permissions: {},
  concurrency: {
    group: "agent-kit-npm-next",
    "cancel-in-progress": false,
  },
  jobs: {
    prepare: {
      if: "github.repository == 'slicemedia/agent-kit' && github.event.repository.private == false && github.ref == 'refs/heads/main' && vars.SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED == 'true'",
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 20,
      environment: "release-sanitize",
      permissions: { contents: "read" },
      outputs: {
        "artifact-id": "${{ steps.upload.outputs.artifact-id }}",
        "artifact-digest": "${{ steps.upload.outputs.artifact-digest }}",
      },
      steps: [
        {
          uses: checkoutAction,
          with: {
            "fetch-depth": 0,
            "persist-credentials": false,
            ref: "${{ inputs.release_commit }}",
          },
        },
        liveCommitCheckStep,
        {
          uses: pnpmSetupAction,
          with: {
            version: "11.21.0",
            runtime: "node@24",
            cache: true,
            install: false,
          },
        },
        {
          run: "npm install --global npm@11.19.0 --ignore-scripts --registry=https://registry.npmjs.org/ --userconfig=/dev/null",
        },
        {
          name: "Prefer reviewed npm CLI",
          shell: "bash",
          run: reviewedNpmPathProof,
        },
        { run: "pnpm install --frozen-lockfile" },
        { run: "pnpm release:publish:check", env: preparationEnvironment },
        { run: "pnpm check" },
        {
          run: "pnpm sanitize",
          env: {
            SLICEMEDIA_FORBIDDEN_TERMS:
              "${{ secrets.SLICEMEDIA_FORBIDDEN_TERMS }}",
            SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true",
          },
        },
        liveCommitCheckStep,
        {
          run: "pnpm release:pack-next",
          env: {
            ...preparationEnvironment,
            SLICEMEDIA_RELEASE_DIRECTORY:
              "${{ runner.temp }}/slicemedia-agent-kit-next",
          },
        },
        {
          id: "upload",
          uses: uploadArtifactAction,
          with: {
            name: "agent-kit-next-candidate",
            path: "${{ runner.temp }}/slicemedia-agent-kit-next/agent-kit.tgz\n${{ runner.temp }}/slicemedia-agent-kit-next/candidate.json\n${{ runner.temp }}/slicemedia-agent-kit-next/npm-cli.tgz\n",
            "if-no-files-found": "error",
            "retention-days": 1,
            "compression-level": 0,
            overwrite: false,
          },
        },
      ],
    },
    publish: {
      needs: "prepare",
      if: "needs.prepare.result == 'success'",
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 10,
      environment: "npm-next",
      permissions: { "id-token": "write" },
      steps: [
        {
          uses: setupNodeAction,
          with: {
            "node-version": "24.15.0",
            "check-latest": false,
            "package-manager-cache": false,
          },
        },
        {
          uses: downloadArtifactAction,
          with: {
            "artifact-ids": "${{ needs.prepare.outputs.artifact-id }}",
            path: "${{ runner.temp }}/slicemedia-agent-kit-next",
          },
        },
        {
          name: "Publish the exact prepared archive",
          shell: "bash",
          env: {
            SLICEMEDIA_ARTIFACT_DIGEST:
              "${{ needs.prepare.outputs.artifact-digest }}",
            SLICEMEDIA_RELEASE_COMMIT: "${{ inputs.release_commit }}",
            SLICEMEDIA_RELEASE_DIRECTORY:
              "${{ runner.temp }}/slicemedia-agent-kit-next",
            SLICEMEDIA_WORKFLOW_COMMIT: "${{ github.sha }}",
          },
          run: publisherScriptPlaceholder,
        },
      ],
    },
    verify: {
      needs: ["prepare", "publish"],
      if: "needs.publish.result == 'success'",
      "runs-on": "ubuntu-latest",
      "timeout-minutes": 25,
      permissions: { contents: "read" },
      steps: [
        {
          uses: checkoutAction,
          with: {
            "persist-credentials": false,
            ref: "${{ inputs.release_commit }}",
          },
        },
        {
          uses: setupNodeAction,
          with: {
            "node-version": "24.15.0",
            "check-latest": false,
            "package-manager-cache": false,
          },
        },
        {
          run: "npm install --global npm@11.19.0 --ignore-scripts --registry=https://registry.npmjs.org/ --userconfig=/dev/null",
        },
        {
          uses: downloadArtifactAction,
          with: {
            "artifact-ids": "${{ needs.prepare.outputs.artifact-id }}",
            path: "${{ runner.temp }}/slicemedia-agent-kit-next",
          },
        },
        {
          run: 'chmod 700 "${SLICEMEDIA_RELEASE_DIRECTORY}"',
          shell: "bash",
          env: {
            SLICEMEDIA_RELEASE_DIRECTORY:
              "${{ runner.temp }}/slicemedia-agent-kit-next",
          },
        },
        {
          run: "node scripts/publish-next.mjs verify",
          env: {
            GITHUB_REPOSITORY_VISIBILITY:
              "${{ github.event.repository.visibility }}",
            SLICEMEDIA_RELEASE_COMMIT: "${{ inputs.release_commit }}",
            SLICEMEDIA_RELEASE_DIRECTORY:
              "${{ runner.temp }}/slicemedia-agent-kit-next",
          },
        },
      ],
    },
  },
};

const allowedActions = [
  checkoutAction,
  pnpmSetupAction,
  uploadArtifactAction,
  setupNodeAction,
  downloadArtifactAction,
  checkoutAction,
  setupNodeAction,
  downloadArtifactAction,
];
const allowedCommands = [
  liveCommitCheck,
  "npm install --global npm@11.19.0 --ignore-scripts --registry=https://registry.npmjs.org/ --userconfig=/dev/null",
  "pnpm install --frozen-lockfile",
  "pnpm release:publish:check",
  "pnpm check",
  "pnpm sanitize",
  liveCommitCheck,
  "pnpm release:pack-next",
  "npm install --global npm@11.19.0 --ignore-scripts --registry=https://registry.npmjs.org/ --userconfig=/dev/null",
  'chmod 700 "${SLICEMEDIA_RELEASE_DIRECTORY}"',
  "node scripts/publish-next.mjs verify",
];
const prohibitedPatterns = [
  ["contents write permission", /contents:\s*write/u],
  ["Git tag command", /\bgit\s+tag\b/u],
  ["GitHub Release command", /\bgh\s+release\b/u],
  ["GitHub Release action", /(?:create-release|action-gh-release)@/u],
  ["Changesets publication action", /changesets\/action(?:\/publish)?@/u],
  [
    "npm latest mutation",
    /(?:--tag\s+latest|dist-tag\s+(?:add|rm)|unpublish|deprecate)/u,
  ],
  ["artifact overwrite", /overwrite:\s*true/u],
  ["reusable workflow", /^\s{4}uses:\s+/mu],
];

export function validatePublishNextWorkflow(source) {
  const errors = [];
  for (const [label, pattern] of prohibitedPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(source)) {
      errors.push(`Publish-next workflow contains a prohibited ${label}.`);
    }
  }
  if ((source.match(/id-token:\s*write/gu) ?? []).length !== 1) {
    errors.push("Only the minimal publisher may receive OIDC capability.");
  }
  if ((source.match(/\$\{\{\s*secrets\./gu) ?? []).length !== 1) {
    errors.push(
      "Only the unprivileged prepare job may receive the private release denylist.",
    );
  }
  if (
    (source.match(/secrets\.SLICEMEDIA_FORBIDDEN_TERMS/gu) ?? []).length !== 1
  ) {
    errors.push(
      "The prepare job must receive the protected private release denylist exactly once.",
    );
  }

  const document = parseDocument(source, {
    prettyErrors: false,
    uniqueKeys: true,
  });
  for (const error of document.errors) {
    errors.push(`Publish-next workflow YAML is invalid: ${error.message}`);
  }
  for (const warning of document.warnings) {
    errors.push(
      `Publish-next workflow YAML warning is not allowed: ${warning.message}`,
    );
  }

  if (document.errors.length === 0 && document.warnings.length === 0) {
    try {
      const workflow = document.toJS({ maxAliasCount: 0 });
      const publisherStep = workflow?.jobs?.publish?.steps?.[2];
      const publisherSource = publisherStep?.run;
      if (
        typeof publisherSource !== "string" ||
        createHash("sha256").update(publisherSource).digest("hex") !==
          publisherScriptDigest
      ) {
        errors.push(
          "The minimal publisher must match the reviewed dependency-free script exactly.",
        );
      }
      if (publisherStep && typeof publisherStep === "object") {
        publisherStep.run = publisherScriptPlaceholder;
      }
      if (!isDeepStrictEqual(workflow, expectedWorkflow)) {
        errors.push(
          "Publish-next workflow must match the reviewed three-job privilege-separated schema exactly.",
        );
      }
    } catch (error) {
      errors.push(
        `Publish-next workflow YAML cannot be converted safely: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const actions = [...source.matchAll(/^\s*(?:-\s+)?uses:\s*(\S+)/gmu)].map(
    (match) => match[1],
  );
  if (!isDeepStrictEqual(actions, allowedActions)) {
    errors.push(
      "Publish-next workflow actions must match the immutable allowlist exactly.",
    );
  }
  const commands = [...source.matchAll(/^\s*-\s+run:\s*(.+)$/gmu)].map(
    (match) => match[1].trim(),
  );
  if (!isDeepStrictEqual(commands, allowedCommands)) {
    errors.push(
      "Publish-next workflow commands must match the reviewed allowlist exactly.",
    );
  }
  return errors;
}

export function validatePublishNextPreflight(
  manifest,
  environment,
  npmVersion,
) {
  const errors = [];
  if (environment.GITHUB_REPOSITORY !== "slicemedia/agent-kit") {
    errors.push("Publish-next is restricted to slicemedia/agent-kit.");
  }
  if (environment.GITHUB_REPOSITORY_VISIBILITY !== "public") {
    errors.push("Publish-next requires a public repository.");
  }
  if (environment.GITHUB_REF !== "refs/heads/main") {
    errors.push(
      "Publish-next requires a workflow dispatch from refs/heads/main.",
    );
  }
  if (environment.GITHUB_EVENT_NAME !== "workflow_dispatch") {
    errors.push("Publish-next requires an explicit workflow_dispatch event.");
  }
  if (environment.SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED !== "true") {
    errors.push(
      "Publish-next requires SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED=true.",
    );
  }
  if (environment.GITHUB_ACTIONS !== "true") {
    errors.push("Publish-next preparation requires GitHub Actions.");
  }
  if (
    environment.ACTIONS_ID_TOKEN_REQUEST_URL ||
    environment.ACTIONS_ID_TOKEN_REQUEST_TOKEN
  ) {
    errors.push(
      "Publish-next preparation must not receive GitHub Actions OIDC capability.",
    );
  }
  const requestedCommit = environment.SLICEMEDIA_RELEASE_COMMIT ?? "";
  if (!/^[0-9a-f]{40}$/u.test(requestedCommit)) {
    errors.push(
      "SLICEMEDIA_RELEASE_COMMIT must be a full lowercase 40-character commit SHA.",
    );
  }
  if (requestedCommit !== environment.GITHUB_SHA) {
    errors.push(
      "SLICEMEDIA_RELEASE_COMMIT must match the main commit in the workflow event.",
    );
  }
  for (const [key, value] of Object.entries(environment)) {
    const normalized = key.toUpperCase();
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      (normalized === "NODE_AUTH_TOKEN" ||
        normalized === "NPM_TOKEN" ||
        normalized === "YARN_NPM_AUTH_TOKEN" ||
        normalized === "NPM_CONFIG_REGISTRY" ||
        normalized === "NPM_CONFIG_USERCONFIG" ||
        normalized === "PNPM_CONFIG_REGISTRY" ||
        normalized === "YARN_NPM_REGISTRY_SERVER" ||
        normalized === "COREPACK_NPM_REGISTRY" ||
        normalized === "SLICEMEDIA_FORBIDDEN_TERMS" ||
        normalized === "SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS" ||
        (/^NPM_CONFIG_/u.test(normalized) && /AUTH|TOKEN/u.test(normalized)))
    ) {
      errors.push(`${key} must not be available to release preparation.`);
    }
  }
  if (manifest.name !== "@slicemedia/agent-kit") {
    errors.push("Publish-next is restricted to @slicemedia/agent-kit.");
  }
  if (manifest.private !== false) {
    errors.push("@slicemedia/agent-kit must explicitly set private=false.");
  }
  if (manifest.publishConfig?.access !== "public") {
    errors.push("publishConfig.access must equal public.");
  }
  if (manifest.publishConfig?.provenance !== true) {
    errors.push("publishConfig.provenance must remain enabled.");
  }
  if (
    typeof manifest.version !== "string" ||
    !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u.test(
      manifest.version,
    )
  ) {
    errors.push("package.json must contain one exact semantic version.");
  }
  if (npmVersion !== "11.19.0") {
    errors.push("Release preparation requires the reviewed npm 11.19.0 CLI.");
  }
  return errors;
}

export async function inspectCurrentMain(runGit) {
  const origin = await runGit(["remote", "get-url", "origin"]);
  await runGit([
    "fetch",
    "--no-tags",
    "--force",
    "origin",
    "+refs/heads/main:refs/remotes/origin/main",
  ]);
  const head = await runGit(["rev-parse", "--verify", "HEAD^{commit}"]);
  const main = await runGit([
    "rev-parse",
    "--verify",
    "refs/remotes/origin/main^{commit}",
  ]);
  const status = await runGit([
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
  ]);
  return {
    head: head.trim(),
    main: main.trim(),
    origin: origin.trim(),
    status,
  };
}

export function validateReleaseCommitState(requestedCommit, state) {
  const errors = [];
  if (!/^[0-9a-f]{40}$/u.test(requestedCommit)) {
    errors.push(
      "The approved release commit must be a full lowercase 40-character SHA.",
    );
  }
  if (
    state.origin !== "https://github.com/slicemedia/agent-kit" &&
    state.origin !== "https://github.com/slicemedia/agent-kit.git"
  ) {
    errors.push(
      "The publication origin must be the reviewed Agent Kit repository.",
    );
  }
  if (requestedCommit !== state.head) {
    errors.push(
      "The checked-out commit does not match the approved release commit.",
    );
  }
  if (state.head !== state.main) {
    errors.push(
      "The approved release commit must still be the current origin/main commit.",
    );
  }
  if (state.status.trim() !== "") {
    errors.push("The publication checkout must be clean.");
  }
  return errors;
}
