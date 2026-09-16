---
name: diagnose-webflow-layout
description: Diagnose reproducible Webflow flex, grid, sizing, overflow, positioning, and breakpoint layout failures and propose the narrowest native fix. Use for responsive defects or content-dependent breakage, not for an open-ended visual redesign.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Diagnose Webflow Layout

Webflow MCP version: 2.0.1.

Diagnose read-only first. Call `webflow_guide_tool` before any other Webflow tool. Prefer Webflow-native structure and styles over browser code. A Designer or remote-state change requires an explicit request and confirmation of the exact plan. If rendered or computed evidence is unavailable, limit the diagnosis to Webflow structure and style data, mark visual behavior unverified, and do not mutate from inference.

The recovery and confirmation gate below applies to every Webflow-hosted mutation this skill can perform, regardless of risk.

## Workflow

1. Record the site/page, affected element, viewport, browser, content state, expected result, actual result, and a reproducible boundary where the layout starts failing. Read site Agent Instructions before interpreting naming or breakpoint conventions.
2. Inspect the element tree, shared classes, combo classes, computed styles, and the nearest ancestors that establish layout or positioning context. Use headless `data_*` reads for structure and styles. Use the Designer bridge only when live selection, breakpoint order, or a visual snapshot is needed.
3. Find the earliest failing ancestor rather than treating the most visible child. Trace intrinsic size, containing block, direct-child participation, and inherited or cascading constraints.
4. Test native causes in this order: box sizing and min/max dimensions; flex basis, shrink, wrap, and alignment; grid tracks, spans, and placement; overflow and transforms; positioned containing blocks and stacking contexts; then breakpoint and combo-class overrides.
5. Exercise realistic content extremes: empty and long text, unbroken strings, missing and extreme-aspect media, CMS list counts, localization expansion, and zoom. Preserve semantic DOM order when changing visual order.
6. Classify the cause and propose the smallest fix, naming the class, breakpoint, shared blast radius, properties changed, and state preserved. Do not hide an unknown overflow source at a page-level ancestor.
7. If the user wants the proposed remote fix, capture pre-state and present the exact bounded operations, target identifiers, blast radius, preserved state, and recovery limitations. Ask the user to save all current Webflow changes and create a new native Webflow restore point, or explicitly waive it after those limits are explained. Hard-stop for a new reply confirming completion or waiver. Existing, automatic, or historical backups, activity history, snapshots, read-back, and advance approvals do not count.
8. After that reply, re-read the affected state. Restart the gate if state or the plan changed. Otherwise ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot double as write confirmation; one gate covers only its unchanged bounded batch. Apply only after this confirmation.
9. Read back the changed scope, restore temporary Designer navigation, and verify neighboring breakpoints, intermediate widths, content extremes, zoom, keyboard order, and affected component/CMS instances. Return evidence, remaining uncertainty, recovery checkpoint, final confirmation, and `published: false`.

Read [the layout diagnostic guide](references/layout-diagnostic-guide.md) when the cause crosses more than one layout context or breakpoint.

## Editor-facing handoff

Name the affected instance, shared component, class/combo class, CMS template or collection, page, and site scope precisely. State whether future edits belong in Webflow or require a separate development handoff, which other instances and breakpoints inherit the result, and the verification, publication, restore-point, or waiver state.

## Stop conditions

Stop before mutation when the target class is shared beyond the agreed scope, the breakpoint cascade is unknown, the recovery checkpoint or separate final confirmation is missing, a component or CMS binding is unresolved, pre-state is stale, the bridge is required but unavailable, or Webflow returns `ModeForbidden`. Editing never authorizes publishing.
