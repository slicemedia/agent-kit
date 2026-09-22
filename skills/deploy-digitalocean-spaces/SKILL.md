---
name: deploy-digitalocean-spaces
description: Explicitly plan and apply stable-URL or immutable deployment of built addon, shared vendor, and optional project artifacts through the optional DigitalOcean Spaces package. Use only when the generated project selected that capability and the user directly asks to deploy its built artifacts.
metadata:
  surfaces: [local-agent]
---

# Deploy DigitalOcean Spaces

This is an optional remote-write workflow. Building or discussing a project is not permission to upload it.

## Workflow

1. Confirm that `@slicemedia/spaces-deployer` is installed and run the local project build first.
2. Require an explicit source directory, HTTPS Spaces endpoint, region, bucket, non-empty prefix, and release label. Default to `mode: stable`, requiring an explicit CDN endpoint ID and dedicated prefix; use immutable mode only when requested or required by the asset contract. For DevKit, deploy all of `dist/`, preserving `addons/`, optional `projects/`, and `vendor/` script and stylesheet paths; keep `.slicemedia/sourcemaps/` outside the deployment source. Read credentials only from local environment variables at apply time.
3. Run `slicemedia-spaces plan` with all target options and an ignored plan-file path. For browser delivery, explicitly plan `--acl public-read` or verify independently configured public access. Never add account, bucket, or prefix defaults to reusable source.
4. Review the plan ID, target, release version, artifact-set digest, sorted object keys, sizes, content types, and SHA-384 digests. For stable mode review the exact keys to replace, cache policy, CDN endpoint, and scoped purge. The release label is an audit field, not a URL segment. Immutable mode instead uses release/digest namespaces and rejects occupied mismatches.
5. Present the exact plan and require explicit confirmation of its ID and target.
6. Only then run `slicemedia-spaces apply --plan <file> --plan-id <id> --yes`. Do not pass credentials as command arguments or log them.
7. Return uploaded/skipped/failed objects and CDN purge status; verify the public JS/CSS URLs and response headers. For a partial failure, inspect the receipt and current state before recovery. Reapplying the same unchanged, approved stable plan skips matching uploads and retries a failed purge; do not invent a new target, delete files, or change bytes under the old plan. Serialize writers to a prefix and report that multi-file deployment is not atomic.

Read [deployment safety](references/deployment-safety.md) before apply.

After a successful addon deployment, complete [the script-tag handoff](../author-webflow-addon/references/script-tag-handoff.md)
with the verified public addon script and emitted stylesheet tags, exact Webflow placement and
scope, required attributes/configuration, and instructions to remove matching local/HMR tags. Derive URLs from
the deployment receipt, mode, and build manifest. Mark failed or unverified assets explicitly;
an upload receipt alone does not prove current CDN delivery. Do not add duplicate shared vendor
tags when the project integration already loads them. Providing tags does not authorize applying
them to Webflow or publishing the site.
