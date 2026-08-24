---
name: audit-webflow-client-first
description: Read-only audit of an existing Webflow site's alignment with Finsweet Client-First conventions. Use when the user explicitly requests a Client-First audit, asks about Finsweet class or structure best practices, or the site's Agent Instructions declare Client-First. Do not use for Finsweet Attributes runtime integrations or Finsweet Components.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Audit Webflow Client-First

Webflow MCP version: 2.0.1.

Audit read-only. Never rename classes, edit styles or elements, install a cloneable or extension, change Agent Instructions or CMS content, or publish through this skill. Call `webflow_guide_tool` before any other Webflow tool. If the guide and callable schema conflict, stop the affected branch and report the mismatch instead of guessing.

## Product and methodology boundary

Client-First is an optional class, structure, and maintainability methodology. Finsweet Attributes is a separate JavaScript and `fs-*` attribute product; Finsweet Components is a separate app-managed product. Neither is evidence that a site follows Client-First. Route those requests to their focused workflows.

Use this skill only when the user asks for a Client-First or Finsweet class-system audit, the site declares Client-First, or the user asks whether the site could align with it. If Client-First is not declared, report compatibility or consistency rather than noncompliance. Never imply Finsweet certification, endorsement, or affiliation.

## Workflow

1. Resolve the exact site and audit scope. Record environment, branch, locale, requested pages, CMS templates, shared components, viewport, and whether rendered output is in scope. Use `unknown` or `not observed` for unavailable fields.
2. Search and read the site's Agent Instructions before interpreting conventions. Record whether they declare Client-First, another system, a hybrid, or no methodology. Project-specific guidance takes precedence over optional starter choices.
3. Inspect read-only evidence with headless `data_*` tools: page and element structure; class names, order, styles, breakpoints, and repeated usage where available; component definitions separately from instances; variables and modes; semantic tags; exposed interaction names; and the style-guide or utility page when present. Use the Designer bridge only for live canvas context or snapshots.
4. For a representative audit, include the relevant ordinary page, shared components, style guide, and CMS template. Paginate all accessible resources before making a whole-site claim. State exactly what was and was not inspected.
5. Classify adoption as `declared Client-First`, `strongly evidenced`, `hybrid or adapted`, `not established`, or `unknown due to limited evidence`. One familiar class or underscore is not proof.
6. Evaluate observed patterns using [the audit reference](references/client-first-audit.md). Treat the current official Finsweet documentation and the inspected project's conventions as authoritative over this summary.
7. Return an evidence ledger. For each finding name the resource and identifier, observation, relevant classes or structure, rule level, confidence, practical impact, and a bounded recommendation. Separate verified observations, inferences, conflicts, and unverified behavior.
8. End with evidenced strengths, limitations, and one smallest reversible next step. Add an editor-facing handoff naming the affected class, component, page, template, or site-wide control surface and `publication state: unchanged`.

## Evidence limits

- A class name suggests intent; it does not prove computed layout, responsive behavior, accessibility, or runtime behavior.
- Absence from sampled pages is not proof of site-wide absence. Do not infer inherited, combo, or breakpoint behavior when exposed style data is incomplete.
- Preserve structured identifiers exactly and distinguish component definitions from instances.
- When the Designer bridge or rendered evidence is unavailable, continue with headless reads and label the missing evidence. Do not claim accessibility or visual quality from structural metadata.
- Do not recommend wholesale conversion by default. Conversion, bulk renaming, or cleanup requires a separate high-risk plan, dependency inventory, restore-point or waiver checkpoint, explicit write confirmation, read-back, and staging verification.

## Finding format

For every finding report: category, observation, exact evidence and scope, rule level (`documented convention`, `recommended strategy`, `optional choice`, or `project-specific`), confidence, maintainability or usability impact, and the smallest reasonable next step. Prioritize real inconsistency and maintenance risk over cosmetic naming differences.
