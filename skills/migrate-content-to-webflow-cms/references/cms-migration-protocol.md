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

## Recovery checkpoint

Before changing schema, reconciling content destructively, or starting a broad/high-risk target batch, require either a manual Webflow restore point that the user confirms is current or an explicit recorded waiver after explaining the missing recovery coverage. A Webflow restore is site-wide and is not an item-level rollback mechanism. Record the checkpoint in the plan and receipt, but never create, invoke, or automate a restore. Keep representative draft samples bounded even when a checkpoint exists.

## Safe transformations

- Rich text: preserve semantic headings, paragraphs, lists, links, and media supported by the target. Reject scripts, inline event handlers, unsafe URL schemes, unapproved embeds, and unreviewed style markup. Quarantine unsupported nodes with source-location evidence rather than silently flattening or dropping them.
- Assets: verify permission to reuse, content type, size, checksum, filename, metadata, and source availability. Deduplicate by reliable content identity, not filename alone. Confirm upload completion before assigning an asset to an item.
- Locales: map locale IDs explicitly and track linked variants by the shared target item identity. Do not invent fallback translations. If current APIs cannot add a required locale variant to an existing item, record a manual task and exclude that item from the automated batch.
- SEO and URLs: distinguish CMS fields used by the template from page-level settings. Preserve a legacy-to-target URL ledger. Redirect creation and publication require separate authorization.
- Status: create and update migration records as drafts even when source content is live. Record intended publication state without applying it.

## Idempotency and batches

Key every operation by stable source key plus locale and its mapped target item ID. Store a normalized source checksum and target read-back checksum. A rerun should become `no-op` when they match, update the mapped target when the approved source changed, and stop on an unmapped collision. Never create a second item merely because a slug changed.

Dry-run all transformations, then choose a representative sample rather than only easy records. Include long and short content, empty optional values, every relationship shape, each asset type, rich text, every locale, and at least one collision or quarantine case when present. Do not continue automatically after the sample.

## Read-back, fidelity, and receipts

Compare written fields, IDs, references, asset metadata, locale linkage, slug, and draft/archive flags with the mapping ledger. For visual verification, use a draft-capable preview or the Designer bridge when available. A rendered staging check may follow only through a separately authorized publishing workflow.

The receipt must identify every source record and locale as `created`, `updated`, `no-op`, `quarantined`, `failed`, or `unknown`; include the target ID, checksums, preserved target fields, asset/reference outcomes, recovery checkpoint, and error details; and state whether retry is safe. `unknown` results require fresh target inspection before any retry. Redact credentials, private source URLs, tokens, personal data, and full sensitive content.

## Official references

This original summary was verified against official Webflow documentation on 2026-08-21:

- [MCP architecture](https://developers.webflow.com/mcp/reference/how-it-works)
- [MCP data tools](https://developers.webflow.com/mcp/tools/data-tools)
- [CMS API overview](https://developers.webflow.com/data/reference)
- [CMS field types and item values](https://developers.webflow.com/data/reference/field-types-item-values)
- [Managing collections and items](https://developers.webflow.com/data/docs/working-with-the-cms/manage-collections-and-items)
- [CMS localization](https://developers.webflow.com/data/docs/working-with-the-cms/localization)
- [CMS publishing](https://developers.webflow.com/data/docs/working-with-the-cms/publishing)
