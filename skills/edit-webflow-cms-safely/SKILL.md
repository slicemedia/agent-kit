---
name: edit-webflow-cms-safely
description: Explicitly plan and perform bounded Webflow CMS record changes with schema inspection, conflict handling, localization checks, read-back, and receipts. Use only when the user directly asks to create, update, publish, unpublish, or delete CMS content.
---

# Edit Webflow CMS Safely

Webflow MCP version: 2.0.1.

Use the official `data_cms_tool`. Inspection alone never authorizes a write.

## Workflow

1. Identify the exact site, collection, locale, records, fields, references, and requested draft or publication state. Read relevant site Agent Instructions first.
2. Read the current collection schema and paginate every relevant item. Preserve returned IDs and never substitute a name or slug for an ID.
3. Detect duplicates and conflicts by stable ID and unique fields. Validate required fields, types, slugs, option values, references, multi-references, and current locale support. Exclude every unresolved conflicted item from the write plan; do not mutate it until the conflict is resolved.
4. Produce a redacted plan with exact before/after values, unchanged protected fields, batch boundaries, risk tier, and expected publication state. Make repeated application idempotent.
5. For a bulk, destructive, schema-dependent, or otherwise high-risk batch, require a manually confirmed Webflow restore point or an explicit recorded waiver. Explain that restore can affect CMS state and is not an item-level undo.
6. Require explicit confirmation for that exact plan before calling a create, update, publish, unpublish, or delete action.
7. Apply bounded batches. Stop automatic continuation after partial failure; do not retry ambiguous writes.
8. Re-read every affected item and emit a receipt containing successes, failures, conflicts, preserved fields, recovery checkpoint, and exact draft/published state. Add an editor-facing handoff naming the collection, locales, affected item scope, editable fields, shared template dependencies, and whether future edits affect one item or the collection model. Publication is a separate operation and must never be inferred.

Read [CMS safeguards](references/cms-safeguards.md) before applying.

## Boundaries

Do not replace rich text with unreviewed HTML, rewrite inline SVG, change collection schema, mass-delete, expose personal data, or work around unsupported localization behavior without separately approved policy and scope.
