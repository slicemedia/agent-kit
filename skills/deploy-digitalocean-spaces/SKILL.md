---
name: deploy-digitalocean-spaces
description: Explicitly plan and apply version-preserving, content-addressed project-bundle deployment through the optional DigitalOcean Spaces package. Use only when the generated project selected that capability and the user directly asks to deploy its built artifacts.
---

# Deploy DigitalOcean Spaces

This is an optional remote-write workflow. Building or discussing a project is not permission to upload it.

## Workflow

1. Confirm that `@slicemedia/spaces-deployer` is installed and run the local project build first.
2. Require an explicit source directory, HTTPS Spaces endpoint, region, bucket, non-empty prefix, and immutable release version. Read credentials only from local environment variables at apply time.
3. Run `slicemedia-spaces plan` with all target options and an ignored plan-file path. Never add account, bucket, or prefix defaults to reusable source.
4. Review the plan ID, target, release version, artifact-set digest, sorted object keys, sizes, content types, and SHA-384 digests. Confirm that no key represents a mutable alias such as `latest`.
5. Present the exact plan and require explicit confirmation of its ID and target.
6. Only then run `slicemedia-spaces apply --plan <file> --plan-id <id> --yes`. Do not pass credentials as command arguments or log them.
7. Return the uploaded/skipped receipt and verify each expected object independently. Stop on partial failure; do not retry by writing the same key or deleting an existing version.

Read [deployment safety](references/deployment-safety.md) before apply.
