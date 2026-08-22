import { isDeepStrictEqual } from "node:util";

import { parseDocument } from "yaml";

const checkoutAction =
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1";
const pnpmSetupAction = "pnpm/setup@84cb39b217b10273981911c288cd62326dc7c6d2";

const expectedWorkflow = {
  name: "CI",
  on: {
    pull_request: null,
    push: { branches: ["main"] },
  },
  permissions: { contents: "read" },
  jobs: {
    verify: {
      name: "${{ matrix.os }} / Node ${{ matrix.node }}",
      "runs-on": "${{ matrix.os }}",
      strategy: {
        "fail-fast": false,
        matrix: {
          os: ["ubuntu-latest", "windows-latest"],
          node: ["22.13.0", 24],
        },
      },
      steps: [
        {
          uses: checkoutAction,
          with: { "persist-credentials": false },
        },
        {
          uses: pnpmSetupAction,
          with: {
            version: "11.21.0",
            runtime: "node@${{ matrix.node }}",
            cache: true,
            install: false,
          },
        },
        { run: "pnpm install --frozen-lockfile" },
        { run: "pnpm check" },
      ],
    },
    "private-release-denylist": {
      if: "github.repository == 'slicemedia/agent-kit' && github.event_name == 'push' && github.ref == 'refs/heads/main'",
      "runs-on": "ubuntu-latest",
      environment: "release-sanitize",
      permissions: { contents: "read" },
      steps: [
        {
          uses: checkoutAction,
          with: { "persist-credentials": false },
        },
        {
          uses: pnpmSetupAction,
          with: {
            version: "11.21.0",
            runtime: "node@22.13.0",
            cache: false,
            install: false,
          },
        },
        {
          run: "node scripts/sanitize.mjs",
          env: {
            SLICEMEDIA_FORBIDDEN_TERMS:
              "${{ secrets.SLICEMEDIA_FORBIDDEN_TERMS }}",
            SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS: "true",
          },
        },
      ],
    },
  },
};

export function validateCiWorkflow(source) {
  const errors = [];
  if (/id-token:\s*write/u.test(source)) {
    errors.push("CI must not receive OIDC publication capability.");
  }
  if (
    (source.match(/secrets\.SLICEMEDIA_FORBIDDEN_TERMS/gu) ?? []).length !== 1
  ) {
    errors.push(
      "CI must expose the private release denylist only to its trusted push-main job.",
    );
  }
  const document = parseDocument(source, {
    prettyErrors: false,
    uniqueKeys: true,
  });
  for (const error of document.errors)
    errors.push(`CI workflow YAML is invalid: ${error.message}`);
  for (const warning of document.warnings)
    errors.push(`CI workflow YAML warning is not allowed: ${warning.message}`);

  if (errors.length === 0) {
    try {
      const workflow = document.toJS({ maxAliasCount: 0 });
      if (!isDeepStrictEqual(workflow, expectedWorkflow)) {
        errors.push(
          "CI workflow must match the reviewed generic PR matrix and trusted private release-denylist job exactly.",
        );
      }
    } catch (error) {
      errors.push(
        `CI workflow YAML cannot be converted safely: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return errors;
}
