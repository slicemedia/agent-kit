# Contributing to Slice Media Agent Kit

Thank you for helping improve Agent Kit. Keep changes focused, reviewable, provider-neutral, and
safe for projects that may contain production Webflow data.

## Development

Use Node 22 or Node 24 and pnpm 11. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm check
```

`pnpm check` formats, lints, typechecks, tests, builds, validates every adapter and skill, inspects
the npm archive, and runs sanitization. GitHub repeats the gate on Linux and Windows for both
supported Node lines.

## Change rules

- Treat `skills/` and `content/rules/` as canonical reviewed sources. Do not hand-edit generated
  consumer adapters.
- Preserve explicit confirmation gates for remote writes, publication, deletion, migration, and
  local user-profile data.
- Keep examples neutral. Do not include client identifiers, site IDs, domains, credentials,
  screenshots, exported project data, or private conversation history.
- Add or update tests for behavioral changes. Platform-specific behavior must be documented and
  covered where the CI platform can exercise it.
- Add a Changeset for every user-visible change with `pnpm changeset`.
- Do not add npm tokens, package publication, tags, or GitHub Releases to the version-PR workflow.

## Pull requests

Explain the user-visible outcome, safety impact, test evidence, and any compatibility limits. Keep
unrelated changes separate. By contributing, you agree that your contribution is licensed under
the repository's MIT License.

For vulnerabilities, do not open a public issue. Follow [SECURITY.md](SECURITY.md).
