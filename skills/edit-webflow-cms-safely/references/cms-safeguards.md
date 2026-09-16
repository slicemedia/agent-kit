# CMS safeguards

- Read schema immediately before planning and again if a write reports schema drift.
- Preserve fields absent from the request, including bindings and system fields.
- Use item IDs as mutation keys; use names and slugs only for conflict detection.
- Resolve reference targets before planning and reject ambiguous matches.
- Do not include an item with an unresolved duplicate, slug, locale, or unique-field conflict in a mutation batch.
- Before every new-item create on a localized site, list the primary and all configured secondary locales and require an explicit scope choice. Present all configured locales as recommended/default, but do not infer acceptance.
- Omitting `cmsLocaleIds` from the Data API create produces only a primary-locale item. Webflow MCP 2.0.1 does not support creating new localized CMS items; if the confirmed scope includes secondary locales, stop rather than silently fall back to primary-only and offer a manual Designer or separately authorized Data API workflow.
- The Data API cannot attach a missing secondary locale to an existing item. Webflow's CMS/Designer can add one manually, so never claim deletion and recreation is the only remedy and never perform either automatically.
- Seed linked locale variants only with approved source content, never invent translations, and read back the shared item identity and status for every requested locale. If any confirmed locale is rejected, stop and report it; never silently drop that locale. Record locale-specific publication state without changing it.
- Offer agent tracking before create/edit, allow an explicit opt-out, and never silently create tracking fields or write through an ambiguous field mapping.
- Treat create/update as draft changes. This skill does not publish or unpublish CMS items; staging site publication belongs to the dedicated staging workflow, while production and item-level publication remain unsupported here.
- Record every item in a partial-failure receipt and resume only from confirmed failures.
- Redact secrets and personal data from plans, logs, snapshots, and receipts.
- Split large jobs into deterministic, reviewable batches.
- For every mutation, require a fresh native Webflow restore point confirmed in a new user reply or an explicit informed waiver, then a separate final confirmation of the unchanged plan. A restore is site-wide recovery with CMS, locale, scheduling, and integration consequences, not an item-level undo or a substitute for pre-state and read-back.

## Official localization references

Verified on 2026-09-16:

- [CMS localization](https://developers.webflow.com/data/docs/working-with-the-cms/localization)
- [Webflow MCP overview and limitations](https://developers.webflow.com/mcp/reference/overview)
- [Localized Collection content in Webflow](https://help.webflow.com/hc/en-us/articles/33961252209171-Localize-Collection-content)
