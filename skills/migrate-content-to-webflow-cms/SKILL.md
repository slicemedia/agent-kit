---
name: migrate-content-to-webflow-cms
description: Plan and execute a bounded, draft-first migration from an identified content source into Webflow CMS with schema, locale, reference, asset, rich-text, SEO, fidelity, and recovery controls. Use only when the user directly asks to migrate content into Webflow CMS.
metadata:
  surfaces: [local-agent]
---

# Migrate Content to Webflow CMS

Webflow MCP version: 2.0.1.

Use the official Webflow MCP `data_*` tools. Source inspection and migration planning do not authorize target writes, external publication, or source-system changes.

## Required workflow

1. Identify the exact source, target site, collections, environments, locales, credentials boundary, requested record scope, and intended final statuses. Read site Agent Instructions and inventory the source before proposing a target schema.
2. Create a mapping specification for collections, fields, types, required values, options, references, assets, rich text, slugs, SEO fields, locales, source status, and legacy URLs. Read [the migration protocol](references/cms-migration-protocol.md) for the ledger and gates.
3. Inspect the current target schemas and paginate all relevant target items and assets. Resolve collisions and existing mappings by stable source and target identities. Preserve target fields absent from the approved mapping.
4. Validate transformations without writing. Quarantine unsupported field values, unsafe rich text, ambiguous references, unlicensed or unavailable assets, slug conflicts, locale gaps, and records with unresolved personally identifiable or sensitive data handling.
5. Produce an idempotent plan with dependency order, stable mapping keys, content checksums, create/update/no-op decisions, batch boundaries, protected target fields, and expected draft state. Before schema changes, destructive reconciliation, or a broad/high-risk target batch, require a manual Webflow restore point confirmed by the user or a recorded waiver acknowledging the recovery gap. A Webflow restore is site-wide, not an item-level rollback; never trigger one automatically. Require explicit confirmation of the current plan before any schema, asset, or item write.
6. Apply one small representative sample as drafts, choosing records that exercise references, assets, rich text, optional fields, locales, and content extremes. Stop on any ambiguous or partial failure; do not retry a write whose outcome is unknown.
7. Re-read the sample by target ID and locale. Compare normalized fields and relationships, verify assets and rich-text semantics, and inspect preview or rendered output for layout, links, media, metadata, and locale fidelity without publishing merely to make verification possible. Present that read-back and fidelity receipt, then continue with the next bounded draft batch only after the user explicitly accepts the sample and confirms that batch. If the mapping, schema, source, or target state changed, re-inspect and present a fresh plan before requesting confirmation.
8. Emit a redacted per-record receipt with source key, target ID, locale, operation, checksum, status, preserved fields, asset/reference outcomes, error, retry safety, and the restore-point or waiver checkpoint used for high-risk work. Resume only confirmed failures from the latest read-back state. Add an editor-facing handoff identifying which values belong to CMS items, shared collection schema, template bindings, local mapping configuration, or a separate publishing/redirect workflow and the scope each edit affects.
9. Keep publish, unpublish, redirect activation, source deletion, and archival as separate explicit workflows with their own plans and confirmations. A completed migration receipt reports intended and actual target status independently.

## Stop conditions

Stop when the source inventory is incomplete, a schema or locale changed after planning, stable identity is missing, a reference target is ambiguous, an asset cannot be lawfully or reliably obtained, rich text contains unresolved active content, a slug/SEO decision is disputed, tool capabilities cannot express the mapping, a result is only partially known, or rendered fidelity cannot be assessed without an unapproved publish.
