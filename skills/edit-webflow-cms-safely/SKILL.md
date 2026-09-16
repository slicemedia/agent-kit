---
name: edit-webflow-cms-safely
description: Explicitly plan and perform bounded Webflow CMS record changes with schema inspection, conflict handling, localization checks, read-back, and receipts. Use only when the user directly asks to create, update, or delete CMS content.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Edit Webflow CMS Safely

Webflow MCP version: 2.0.1.

Use the official `data_cms_tool`. A direct Data API workflow requires separate explicit authorization and an established credential boundary; never improvise one to bypass an MCP limitation. Inspection alone never authorizes a write.

Call `webflow_guide_tool` before any other Webflow tool. If the returned guide and callable schema conflict, stop the affected operation and report the mismatch instead of guessing.

## Workflow

1. Identify the exact site, collection, records, fields, references, requested draft state, and locale scope. Read relevant site Agent Instructions first.
2. Read the site's current locale list, the current collection schema, and every relevant item with pagination. Preserve returned IDs and never substitute a name or slug for an ID.
3. Before creating an item on a localized site, show the primary and every configured secondary locale with its name, tag, `cmsLocaleId`, and enabled state. Ask the user to choose the creation scope; present all configured locales as the recommended default, but never treat silence as acceptance. Webflow MCP 2.0.1 cannot create new localized CMS items. If the confirmed scope includes a secondary locale, stop instead of silently creating a primary-only item and offer manual creation in Webflow's CMS/Designer or a separately authorized direct Data API workflow with the same safety gates.
4. Before creating or editing content, offer the optional agent-tracking fields described in [CMS agent tracking](references/cms-agent-tracking.md). Write tracking values only after explicit acceptance; the user may decline and continue. Never create a missing tracking field or choose among ambiguous duplicates without a separate reviewed schema plan.
5. Detect duplicates and conflicts by stable ID and unique fields. Validate required fields, types, slugs, option values, references, multi-references, tracking-field mappings, and current locale support. Exclude every unresolved conflicted item from the write plan; do not mutate it until the conflict is resolved.
6. Produce a redacted, idempotent plan with exact before/after values, protected fields, locale IDs, batch boundaries, expected draft state, tracking choice, and rollback limitations.
7. For every Webflow-hosted mutation, ask the user to create a fresh native Webflow restore point after all current changes are saved, or explicitly waive it after the recovery limitations are explained. Stop and wait for a new reply confirming completion or waiver. A snapshot, activity record, old backup, or automatic backup does not satisfy this gate.
8. After the restore-point reply, re-read the site's locale list, collection schema, relevant items, references, and tracking-field mapping. If the target, state, scope, or plan changed, re-inspect and restart both gates. Only when that state is unchanged, ask for a separate final confirmation of the exact plan immediately before the first write. The restore-point confirmation or waiver cannot double as write confirmation.
9. Apply only the confirmed bounded draft batch. Stop automatic continuation after partial failure; do not retry ambiguous writes. This skill does not publish or unpublish CMS items. Route an approved staging site publication to the dedicated staging workflow; production and item-level publication are unsupported by this skill, and draft-edit confirmation never authorizes either.
10. Re-read every affected item in every confirmed locale and emit a receipt containing successes, failures, conflicts, preserved fields, locale linkage and state, tracking choice and field mapping, recovery checkpoint, exact draft state, and unchanged publication state. Add an editor-facing handoff naming the collection, locales, affected item scope, editable fields, shared template dependencies, and whether future edits affect one item or the collection model. Publication is a separate operation and must never be inferred.

Read [CMS safeguards](references/cms-safeguards.md) and [CMS agent tracking](references/cms-agent-tracking.md) before planning a mutation.

## Boundaries

Do not replace rich text with unreviewed HTML, rewrite inline SVG, change collection schema, mass-delete, expose personal data, publish or unpublish items, or work around unsupported localization behavior without a separately approved supported workflow and scope.
