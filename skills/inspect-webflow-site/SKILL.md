---
name: inspect-webflow-site
description: Inspect Webflow pages, components, properties, variants, CMS, attributes, styles, and scripts without changing remote state. Use before planning implementation, mapping an existing site, or diagnosing a Webflow contract.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Inspect Webflow Site

Webflow MCP version: 2.0.1.

Start read-only and return evidence, not assumptions. Call `webflow_guide_tool` before any other Webflow tool and treat the returned guide and callable schemas as the current operating contract. If they conflict, stop the affected branch and report the mismatch instead of guessing.

## Workflow

1. Establish the exact site, page, environment, branch, locale, and viewport in scope. Report every field explicitly; use `unknown` or `not observed` when a tool cannot return it.
2. Search and read site Agent Instructions with `data_agent_instructions_tool` before interpreting site conventions.
3. Use headless `data_*` reads for pages, element trees, component definitions, instance props, variants, styles, CMS, assets, and scripts. Most inspection does not require the Designer bridge.
4. Use `designer_tool` only for live page, selection, mode, branch, canvas, and breakpoint context; use `element_snapshot_tool` only when visual evidence is necessary.
5. Preserve identifiers exactly as returned. Treat `{component, element}` identifiers as structured values, not strings to normalize.
6. Distinguish component definitions from instances and props, base styles from shared/combo classes, static values from bindings, drafts from published content, and registered scripts from applied scripts.
7. Maintain an evidence ledger as reads complete. Every count, date, property, contract, and absence claim must come from a successful current read of the authoritative surface. Use direct site metadata for publication timestamps and direct component definitions for component property contracts. Report conflicting or unavailable evidence instead of filling gaps from memory or adjacent records.
8. Separate verified facts from inferences, conflicts, accessibility risks, and unverified areas. Unless the user requested a roadmap, recommend one smallest reversible next step rather than selecting a design or component system from read-only evidence. Add an editor-facing handoff naming each relevant control surface, whether its scope is one instance, every component instance, a page, collection schema, or the whole site, and the unchanged publication state. Restore the original Designer canvas context after temporary navigation.

Read [the inspection checklist](references/inspection-checklist.md) before reporting.

## Safety

- Do not call write actions during inspection, including instruction updates.
- Do not collect tokens, submissions, personal data, or unrelated content.
- A missing Designer bridge blocks only live-context evidence; continue with headless reads where possible.
- A `ModeForbidden` response is a scope signal, not permission to use a different destructive path.
- Reconcile identifiers before calling a record stale, orphaned, unused, or missing; otherwise label its status unresolved.
- Structural reads do not prove rendered, responsive, keyboard, focus, or accessibility behavior. Without rendered evidence, describe semantics only and mark behavior unverified.
- Do not return Designer bridge, developer, or connection URLs containing opaque app parameters. If live Designer context is needed, ask the user to open the named site normally.
