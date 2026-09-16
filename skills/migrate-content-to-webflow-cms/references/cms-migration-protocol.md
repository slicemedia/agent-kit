# CMS migration protocol

Use this reference to prepare the mapping ledger, migration plan, sample acceptance, and receipt.

## Source inventory

Record the source system and immutable record key, source locale and relationships, field types and raw values, status, canonical and legacy URLs, SEO title/description/social fields, assets with rights and provenance, rich-text features, timestamps that matter, and any sensitive-data constraints. Count every record and relationship so omissions are visible.

Do not assume a source name or slug is stable. Preserve source identifiers in a durable mapping ledger controlled by the user. If stored locally, keep the ledger and raw exports out of version control unless the user explicitly approves a safe repository artifact.

## Mapping ledger

For each source field, define:

- destination collection and field ID, Webflow field type, required/default behavior, and normalization;
- locale behavior and fallback policy;
- reference or multi-reference target and dependency order;
- asset acquisition, hash/deduplication, metadata, alt text, and failure behavior;
- rich-text sanitation and semantic preservation rules;
- slug policy, collision handling, canonical/legacy URL mapping, SEO mapping, and intended status;
- an explicit outcome for unmapped content: preserve externally, transform, quarantine, or omit with approval.

Schema changes are target writes. Review them separately and create only the fields needed for the approved mapping. Resolve reference targets before dependent item writes; use target item IDs, not names or slugs.

For each target collection, offer the optional tracking contract in [CMS agent tracking](../../edit-webflow-cms-safely/references/cms-agent-tracking.md). Let the user decline without blocking migration. If accepted, map exact returned field IDs, slugs, and types; do not silently create missing fields or choose among ambiguous duplicates. Treat tracking field creation as a separately planned schema mutation.

## Recovery checkpoint

Before every target mutation, require either a fresh native Webflow restore point that the user confirms in a new reply after current changes are saved or an explicit informed waiver. Stop after that reply and ask for a separate final confirmation of the unchanged exact plan immediately before the first write; the restore-point reply cannot double as confirmation. Restart both gates when target state or plan changes. Snapshots, activity history, old backups, and automatic backups do not count. A Webflow restore is site-wide and is not an item-level rollback mechanism. Record the checkpoint in the plan and receipt, but never create, invoke, or automate a restore. Keep representative draft samples bounded even when a checkpoint exists.

## Safe transformations

- Rich text: preserve semantic headings, paragraphs, lists, links, and media supported by the target. Reject scripts, inline event handlers, unsafe URL schemes, unapproved embeds, and unreviewed style markup. Quarantine unsupported nodes with source-location evidence rather than silently flattening or dropping them.
- Assets: verify permission to reuse, content type, size, checksum, filename, metadata, and source availability. Deduplicate by reliable content identity, not filename alone. Confirm upload completion before assigning an asset to an item.
- Locales: before any create, list the primary and every configured secondary locale and require an explicit scope choice. Present all configured locales as the recommended default, but never infer it. On a supported direct Data API create, pass every confirmed `cmsLocaleId` in the initial operation, seed variants only from approved content, and then update reviewed translations per locale. Webflow MCP 2.0.1 does not support creating new localized CMS items; if the confirmed scope includes secondary locales, stop instead of falling back to primary-only and offer a manual Designer or separately authorized Data API workflow. The Data API cannot attach a missing secondary locale later, although Webflow's CMS/Designer can add one manually. Never delete and recreate automatically. Track linked variants by shared target item identity and verify status per locale.
- SEO and URLs: distinguish CMS fields used by the template from page-level settings. Preserve a legacy-to-target URL ledger. Redirect creation and publication require separate authorization.
- Status: create and update migration records as drafts even when source content is live. Record intended publication state without applying it.

## Idempotency and batches

Key every operation by stable source key plus locale and its mapped target item ID. Store a normalized source checksum and target read-back checksum. A rerun should become `no-op` when they match, update the mapped target when the approved source changed, and stop on an unmapped collision. Never create a second item merely because a slug changed.

Dry-run all transformations, then choose a representative sample rather than only easy records. Include long and short content, empty optional values, every relationship shape, each asset type, rich text, every locale, and at least one collision or quarantine case when present. Do not continue automatically after the sample.

## Read-back, fidelity, and receipts

Compare written fields, IDs, references, asset metadata, locale linkage, slug, and draft/archive flags with the mapping ledger. For visual verification, use a draft-capable preview or the Designer bridge when available. A rendered staging check may follow only through a separately authorized publishing workflow.

The receipt must identify every source record and locale as `created`, `updated`, `no-op`, `quarantined`, `failed`, or `unknown`; include the target ID, checksums, preserved target fields, tracking choice and exact mapping, asset/reference outcomes, recovery checkpoint, and error details; and state whether retry is safe. `unknown` results require fresh target inspection before any retry. Redact credentials, private source URLs, tokens, personal data, and full sensitive content.

## Official references

This summary was verified against official Webflow documentation on 2026-09-16:

- [MCP architecture](https://developers.webflow.com/mcp/reference/how-it-works)
- [MCP data tools](https://developers.webflow.com/mcp/tools/data-tools)
- [CMS API overview](https://developers.webflow.com/data/reference)
- [CMS field types and item values](https://developers.webflow.com/data/reference/field-types-item-values)
- [Managing collections and items](https://developers.webflow.com/data/docs/working-with-the-cms/manage-collections-and-items)
- [CMS localization](https://developers.webflow.com/data/docs/working-with-the-cms/localization)
- [CMS publishing](https://developers.webflow.com/data/docs/working-with-the-cms/publishing)
- [Webflow MCP overview and limitations](https://developers.webflow.com/mcp/reference/overview)
