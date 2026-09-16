---
name: migrate-content-to-webflow-cms
description: Plan and execute a bounded, draft-first migration from an identified content source into Webflow CMS with schema, locale, reference, asset, rich-text, SEO, fidelity, and recovery controls. Use only when the user directly asks to migrate content into Webflow CMS.
metadata:
  surfaces: [local-agent]
---

# Migrate Content to Webflow CMS

Webflow MCP version: 2.0.1.

Use the official Webflow MCP `data_*` tools. A direct Data API workflow requires separate explicit authorization and an established credential boundary. Source inspection and migration planning do not authorize target writes, external publication, or source-system changes.

## Required workflow

1. Identify the exact source, target site, collections, environments, locales, credentials boundary, requested record scope, and intended final statuses. Read site Agent Instructions, inspect the site's locale list, and inventory the source before proposing a target schema.
2. Create a mapping specification for collections, fields, types, required values, options, references, assets, rich text, slugs, SEO fields, locales, source status, and legacy URLs. Read [the migration protocol](references/cms-migration-protocol.md) for the ledger and gates. For every target collection, offer the optional [CMS agent tracking protocol](../edit-webflow-cms-safely/references/cms-agent-tracking.md); refusal does not block migration.
3. Inspect the current target schemas and paginate all relevant target items and assets. Resolve collisions and existing mappings by stable source and target identities. Preserve target fields absent from the approved mapping.
4. Validate transformations without writing. Quarantine unsupported field values, unsafe rich text, ambiguous references, unlicensed or unavailable assets, slug conflicts, locale gaps, and records with unresolved personally identifiable or sensitive data handling.
5. Before planning any create on a localized site, list the primary and every configured secondary locale with names, tags, `cmsLocaleId` values, and enabled states. Require an explicit creation-scope choice for the batch; present all configured locales as the recommended default, but never infer it. If the callable tool cannot express the confirmed locale set, stop rather than silently create primary-only records.
6. Produce an idempotent plan with dependency order, stable mapping keys, content checksums, create/update/no-op decisions, exact locale IDs, batch boundaries, protected target fields, tracking choice, and expected draft state. For every Webflow-hosted mutation, ask the user to create a fresh native Webflow restore point after current changes are saved, or explicitly waive it after recovery limitations are explained. Stop and wait for a new reply; snapshots, activity history, old backups, and automatic backups do not count.
7. After that restore-point reply, re-check the source inventory and checksums, then re-read the target locale list, schemas, relevant items, assets, references, and tracking mappings. If source or target state, scope, mapping, or plan changed, re-inspect and restart both gates. Only when state is unchanged, ask for a separate final confirmation of the exact plan immediately before the first schema, asset, or item write. The backup confirmation or waiver cannot double as write confirmation.
8. Apply one small representative sample as drafts, choosing records that exercise references, assets, rich text, optional fields, locales, and content extremes. Stop on any ambiguous or partial failure; do not retry a write whose outcome is unknown.
9. Re-read the sample by target ID and every confirmed locale. Compare normalized fields, locale linkage, tracking values, and relationships; verify assets and rich-text semantics; and inspect preview or rendered output for layout, links, media, metadata, and locale fidelity without publishing merely to make verification possible. Present that read-back and fidelity receipt, then continue with the next bounded draft batch only after the user accepts the sample and the next unchanged batch completes its own restore-point/waiver reply and separate final confirmation. If the mapping, schema, source, target state, or locale scope changed, re-inspect and present a fresh plan.
10. Emit a redacted per-record receipt with source key, target ID, locale, operation, checksum, status, preserved fields, tracking choice and field mapping, asset/reference outcomes, error, retry safety, and recovery checkpoint. Resume only confirmed failures from the latest read-back state. Add an editor-facing handoff identifying which values belong to CMS items, shared collection schema, template bindings, local mapping configuration, or a separate publishing/redirect workflow and the scope each edit affects.
11. Migration never authorizes publish, unpublish, redirect activation, source deletion, or archival. Route an approved staging site publication to the dedicated staging workflow. Production publication and CMS item-level publish/unpublish are not included; a completed migration receipt reports intended and actual draft state independently.

## Stop conditions

Stop when the source inventory is incomplete, a schema or locale changed after planning, stable identity is missing, a reference target is ambiguous, an asset cannot be lawfully or reliably obtained, rich text contains unresolved active content, a slug/SEO decision is disputed, tracking fields are ambiguous, tool capabilities cannot express the confirmed locale set or mapping, a result is only partially known, or rendered fidelity cannot be assessed without an unapproved publish.
