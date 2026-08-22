# CMS safeguards

- Read schema immediately before planning and again if a write reports schema drift.
- Preserve fields absent from the request, including bindings and system fields.
- Use item IDs as mutation keys; use names and slugs only for conflict detection.
- Resolve reference targets before planning and reject ambiguous matches.
- Do not include an item with an unresolved duplicate, slug, locale, or unique-field conflict in a mutation batch.
- Keep locale-specific changes separate and stop when the current MCP schema cannot express the requested locale behavior.
- Treat create/update as draft changes; publish and unpublish are separate confirmed actions.
- Record every item in a partial-failure receipt and resume only from confirmed failures.
- Redact secrets and personal data from plans, logs, snapshots, and receipts.
- Split large jobs into deterministic, reviewable batches.
- Require a confirmed manual Webflow restore point or explicit waiver before bulk deletion or another high-risk batch. A restore is site-wide recovery with CMS, locale, scheduling, and integration consequences, not a substitute for item-level pre-state and read-back.
