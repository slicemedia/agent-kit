---
name: edit-webflow-designer-safely
description: Explicitly inspect, plan, and apply bounded Webflow page, element, component, property, variant, style, or variable changes through Webflow MCP. Use only when the user asks to change Designer-owned structure or styling.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Edit Webflow Designer Safely

Webflow MCP version: 2.0.1.

Most edits use headless `data_*` tools. The Designer bridge supplies live canvas context and snapshots, not the default mutation path.

Call `webflow_guide_tool` before any other Webflow tool. If the returned guide and callable schema conflict, stop the affected operation and report the mismatch instead of guessing.

The recovery and confirmation gate below applies to every Webflow-hosted mutation this skill can perform, regardless of risk.

## Workflow

1. Resolve the exact site and page, then read site Agent Instructions. Inspect the target and its surrounding component, styles, bindings, props, and variants.
2. Classify the requested scope: page element, shared component definition, component instance prop, variant, shared/combo style, or variable. State the expected blast radius and change-risk tier.
3. Preserve identifiers exactly, including structured `{component, element}` values. Never invent an ID from a name or flatten a composite identifier.
4. Capture pre-state and propose the smallest exact bounded operation with target identifiers, blast radius, protected fields, preserved state, and recovery limitations listed explicitly.
5. Ask the user to save all current changes and create a new native Webflow restore point with a recognizable description, or to explicitly waive it after the plan explains the recovery limitations. Hard-stop for a new reply confirming completion or waiver. Existing, automatic, or historical backups, activity history, Designer snapshots, and advance approvals do not count.
6. After that reply, re-read the affected state. If state or the plan changed, restart the gate. Otherwise ask for a separate final confirmation of the exact site, scope, current plan, and blast radius immediately before the first write. The restore-point or waiver reply cannot double as write confirmation; one completed gate covers only its unchanged bounded batch.
7. Use the focused tool: `data_element_tool`, `data_element_settings_tool`, `data_component_tool`, `data_component_props_tool`, `data_component_variants_tool`, `data_style_tool`, or `data_variable_tool`.
8. Read back the same scope and compare with the plan. Stop automatic continuation after a partial failure or stale result. Use `element_snapshot_tool` only when visual verification is needed and the bridge is available.
9. Restore the original Designer page/component view after temporary navigation. Return a receipt containing the risk tier, recovery checkpoint, final confirmation, changes, preserved state, mismatches, partial failures, errors, and `published: false`.
10. Provide an editor-facing handoff naming the affected scope and whether future edits affect one element, one component instance, every component instance, one page, shared styles or variables, CMS content, or the entire site.

Read [Designer safety](references/designer-safety.md) before changing a shared definition, style, variant, binding, or variable.

## Stop conditions

Stop on ambiguous scope, unresolved binding, stale pre-state, unexpected shared usage, a missing recovery checkpoint or separate final confirmation, insufficient permissions, or `ModeForbidden`. Request the required mode or narrower scope; do not switch to a broader fallback operation. Never restore a backup implicitly; restoration requires a separate impact review and confirmation. Editing never authorizes publishing.
