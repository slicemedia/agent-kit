---
name: edit-webflow-designer-safely
description: Explicitly inspect, plan, and apply bounded Webflow page, element, component, property, variant, style, or variable changes through Webflow MCP. Use only when the user asks to change Designer-owned structure or styling.
---

# Edit Webflow Designer Safely

Webflow MCP version: 2.0.1.

Most edits use headless `data_*` tools. The Designer bridge supplies live canvas context and snapshots, not the default mutation path.

## Workflow

1. Resolve the exact site and page, then read site Agent Instructions. Inspect the target and its surrounding component, styles, bindings, props, and variants.
2. Classify the requested scope: page element, shared component definition, component instance prop, variant, shared/combo style, or variable. State the expected blast radius and change-risk tier.
3. Preserve identifiers exactly, including structured `{component, element}` values. Never invent an ID from a name or flatten a composite identifier.
4. Capture pre-state and propose the smallest operation with protected fields and unrelated state listed explicitly. For a high-blast change, require a manually confirmed Webflow restore point or an explicit recorded waiver before write confirmation. A Designer snapshot is not a backup.
5. Use the focused tool: `data_element_tool`, `data_element_settings_tool`, `data_component_tool`, `data_component_props_tool`, `data_component_variants_tool`, `data_style_tool`, or `data_variable_tool`.
6. Read back the same scope and compare with the plan. Use `element_snapshot_tool` only when visual verification is needed and the bridge is available.
7. Restore the original Designer page/component view after temporary navigation. Return a receipt containing the risk tier, recovery checkpoint, changes, preserved state, mismatches, errors, and `published: false`.
8. Provide an editor-facing handoff naming the affected scope and whether future edits affect one element, one component instance, every component instance, one page, shared styles or variables, CMS content, or the entire site.

Read [Designer safety](references/designer-safety.md) before changing a shared definition, style, variant, binding, or variable.

## Stop conditions

Stop on ambiguous scope, unresolved binding, stale pre-state, unexpected shared usage, a missing high-risk recovery checkpoint, insufficient permissions, or `ModeForbidden`. Request the required mode or narrower scope; do not switch to a broader fallback operation. Never restore a backup implicitly; restoration requires a separate impact review and confirmation.
