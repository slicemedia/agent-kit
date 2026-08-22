---
name: inspect-webflow-site
description: Inspect Webflow pages, components, properties, variants, CMS, attributes, styles, and scripts without changing remote state. Use before planning implementation, mapping an existing site, or diagnosing a Webflow contract.
---

# Inspect Webflow Site

Webflow MCP version: 2.0.1.

Start read-only and return evidence, not assumptions.

## Workflow

1. Establish the exact site, page, environment, branch, and viewport in scope. Use `webflow_guide_tool` or its resource when the current schema is uncertain.
2. Search and read site Agent Instructions with `data_agent_instructions_tool` before interpreting site conventions.
3. Use headless `data_*` reads for pages, element trees, component definitions, instance props, variants, styles, CMS, assets, and scripts. Most inspection does not require the Designer bridge.
4. Use `designer_tool` only for live page, selection, mode, branch, canvas, and breakpoint context; use `element_snapshot_tool` only when visual evidence is necessary.
5. Preserve identifiers exactly as returned. Treat `{component, element}` identifiers as structured values, not strings to normalize.
6. Distinguish component definitions from instances and props, base styles from shared/combo classes, static values from bindings, drafts from published content, and registered scripts from applied scripts.
7. Report facts, inferences, conflicts, accessibility risks, and the smallest reversible next step. Add an editor-facing handoff naming each relevant control surface, whether its scope is one instance, every component instance, a page, collection schema, or the whole site, and the unchanged publication state. Restore the original Designer canvas context after temporary navigation.

Read [the inspection checklist](references/inspection-checklist.md) before reporting.

## Safety

- Do not call write actions during inspection, including instruction updates.
- Do not collect tokens, submissions, personal data, or unrelated content.
- A missing Designer bridge blocks only live-context evidence; continue with headless reads where possible.
- A `ModeForbidden` response is a scope signal, not permission to use a different destructive path.
