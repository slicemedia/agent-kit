# Release process

Agent Kit is one independently versioned package. Changesets records user-visible changes and owns
the version in `package.json`; Git tags and GitHub Releases are distribution records, not the source
of the package version.

## Release preparation

The initial public baseline is already versioned as `0.1.0`. Its development history is
consolidated in `CHANGELOG.md`, so publish that reviewed baseline without running a version step.
For every publishable change after `0.1.0`, add a changeset with `pnpm changeset`.
`pnpm version-packages` applies those later changesets, updates the lockfile, and verifies the
single-package version metadata.

The `Release PR` workflow is intentionally version-only. It runs only after a push to `main`; manual
dispatch is not supported. It can create a draft Changesets version pull request for maintenance
releases. The version job also requires the repository variable `SLICEMEDIA_RELEASE_PR_ENABLED` to
equal `true`. Keep that variable unset unless the release-PR workflow is deliberately active and
the organization or repository policy allows GitHub Actions to create pull requests. A push may
trigger the workflow while the variable is unset, but the version job skips without running.

The workflow has no npm credential, OIDC publication permission, publish command, tag command, or
GitHub Release step. Its structural safety guard requires an explicit private or public visibility
and rejects an unexpected repository, ambiguous package privacy metadata, npm credentials, extra
jobs or steps, and changes to the exact trigger, permission, action, command, or version-input
schema. Its private release-denylist scan is bound to the main-only `release-sanitize` environment;
the generic pull-request matrix never receives that environment secret.

Before merging a version pull request, run `pnpm check` with Node 22.13 or newer in the Node 22 line
and with Node 24, then inspect the `npm pack --dry-run` inventory. The GitHub matrix runs the same
package gate on Linux and Windows. Sanitization, adapter validation, skill evaluations, and a packed
consumer test in DevKit must pass with the actual Agent Kit archive.

## Public release candidate

The separate `Publish npm prerelease` workflow runs only after a manual dispatch supplies the full
lowercase 40-character release commit, the repository is public, and
`SLICEMEDIA_NPM_PUBLISH_NEXT_ENABLED` explicitly equals `true`. The checked-in package must
explicitly set `private: false`.

### One-time npm identity bootstrap

npm requires the scoped package record to exist before its trusted publisher can be attached. For
the first release only, an npm organization owner must publish a minimal identity package with
public access as `0.0.0-bootstrap.0` under a non-default `bootstrap` tag. This artifact proves control
of `@slicemedia/agent-kit`; it is not an Agent Kit product release and must not receive the `next`
or `latest` tag.

Use an explicitly authenticated owner session protected by 2FA. Do not create a long-lived
automation token, and never place npm credentials in this repository, GitHub Actions, generated
files, receipts, or logs. After publication, verify the package scope, Slice Media organization
ownership, version, and `bootstrap` tag from an unauthenticated registry request. Then configure
the trusted publisher with the `npm publish` allowed action and use only the reviewed OIDC workflow
for real releases.

Before enabling the workflow:

1. Finish the naming, ownership, sanitization, legal, and automated clean-room neutral-project
   gates. A live client-project pilot is not required before the first `0.x` release under `next`.
2. Complete and verify the one-time identity bootstrap above. Bind the package's npm trusted
   publisher to `slicemedia/agent-kit`, `.github/workflows/publish-next.yml`, and the `npm-next`
   GitHub environment, with the `npm publish` action explicitly allowed.
3. Keep the main-only `release-sanitize` environment separate from `npm-next`. Store the reviewed
   private release denylist as a JSON string array in the `release-sanitize` environment secret
   `SLICEMEDIA_FORBIDDEN_TERMS`; configured values are never printed. Configure `npm-next` with
   required reviewers and no denylist or npm token. Keep the repository enablement variable unset
   until npm trusted publishing and both environment policies have been independently verified.
4. Merge the reviewed version change on `main`, confirm that the target version is not already on
   npm, confirm the repository is public, and only then set the enablement variable.
5. Dispatch the workflow with the exact full commit SHA currently at `origin/main`. Required
   reviewers must compare the input with the reviewed release commit before approving the
   `npm-next` environment.

The workflow separates three trust boundaries. The `prepare` job has read-only repository access,
uses `release-sanitize`, and has no OIDC permission. Immediately after checkout—and before pnpm
setup, dependency installation, or any checked-out repository script—a reviewed dependency-free
Bash/Git check requires a full lowercase SHA and proves that the requested SHA, workflow-event SHA,
checked-out `HEAD`, and the live `refs/heads/main` returned by `git ls-remote` are identical with a
clean worktree. It rejects ambient authentication, registry, and user-configuration overrides. The
same check runs again immediately before packing, and the repository preflight refreshes
`origin/main`; a delayed or repeated run therefore fails if main has advanced.

After the first live check, the workflow installs the reviewed npm 11.19.0 CLI from the explicitly
pinned public registry before installing project dependencies and running the clean-room gate. The
release gate requires the protected private terms, derives exact plaintext, UTF-8 base64, and hex
rules only in memory, and reports rule indices and kinds without values. The pack step creates one
fixed package archive, a schema-validated receipt, and a reviewed npm 11.19.0 CLI archive in an
exclusively created, owner-private GitHub runner temporary directory. It records SHA-512 npm
integrity and a deterministic archive-tree digest and does not run package lifecycle scripts.

Only the minimal `publish` job receives `id-token: write` through the protected `npm-next`
environment. It has no checkout, repository scripts, dependency installation, npm token, private
denylist, or repository write permission. Pinned GitHub actions download the immutable prepared
artifact. A dependency-free publisher validates the exact artifact schema, file types, package
metadata, receipt, archive integrity, and pinned npm CLI bytes. It checks live `main` before registry
access and again immediately before publication, then passes the fixed `.tgz`—never a mutable
working directory—to `npm publish --ignore-scripts --tag next --provenance`. Every npm operation
pins `https://registry.npmjs.org/` and uses an empty user configuration; ambient registry,
user-config, authentication, and token overrides are rejected.

The final `verify` job is unprivileged: it receives neither OIDC nor a protected environment or
secret. It requires npm 11.19.0, verifies npm's exact version and `dist.integrity`, downloads the
public registry archive, compares both its bytes and file tree with the approved archive, and checks
the `next` tag. An already-published identical version is accepted without a second publish attempt;
a byte mismatch fails closed. Structural tests reject additional steps, altered actions, broad
permissions, credential paths, `latest`, Git tags, and GitHub Releases.

After the first verified OIDC release, set the package's npm Publishing access to require
two-factor authentication and disallow tokens. Trusted publishing is additive, so this package
setting closes token-based publication paths outside the reviewed workflow.

Publish immutable `0.x` release candidates under npm's `next` tag first. After a successful npm publish,
review the registry verification receipt and create the matching Git tag and GitHub Release from
the exact version commit through a separate explicit operation. Promote the already published
artifact to `latest` only after the release candidates and public-readiness review pass; do not
rebuild it for promotion.

Use real client projects as pilots after the first `next` prerelease. Record problems as reviewed
changes and publish fixes as further immutable `next` versions. Do not promote any artifact to
`latest` until those pilots and the public-readiness review pass.

If npm publication succeeds but registry verification fails, do not rerun publication blindly: npm
versions are immutable. Inspect the exact version on npm, repair only the verification or dist-tag
state after review, and retain the failed workflow as the release receipt.
