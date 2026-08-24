---
name: manage-webflow-attributes
description: Explicitly inspect, plan, and update neutral data-wft attributes on Webflow elements while preserving unrelated attributes and bindings. Use when connecting Designer markup to a Slice Media DevKit enhancement or auditing an existing behavior contract.
metadata:
  surfaces: [local-agent]
---

# Manage Webflow Attributes

Webflow MCP version: 2.0.1.

Use `data_element_tool` for attribute reads and writes. Attribute inspection is read-only; adding, changing, or removing a hook requires explicit confirmation.

## Workflow

1. Resolve the exact site, page, component scope, and target elements. Read relevant site Agent Instructions.
2. Read current attributes with bindings resolved when relevant. Preserve the returned structured element IDs.
3. Compare the requested addon metadata with the markup. Use only documented `data-wft-*` names and validated values; do not repurpose classes or DOM IDs as hidden behavior hooks.
4. Plan exact `set_attributes` and `remove_attribute` operations. List all existing attributes and bindings that remain untouched.
5. Warn when the target is inside a shared component definition or when one edit will affect repeated CMS/component instances. For a high-blast shared-definition or bulk behavior change, require a confirmed manual Webflow restore point or explicit recorded waiver.
6. Require confirmation of the exact blast radius.
7. Apply the confirmed attributes, read them back, and return a per-element receipt with changes, preserved attributes, recovery checkpoint when required, failures, and publication state. Add an editor-facing handoff naming the element/component scope, documented hook owner, editable values, repeated consumers, and local runtime entry that implements the behavior.

Read [the attribute contract](references/attribute-contract.md) before applying changes.

## Boundaries

Never overwrite `id`, accessibility, analytics, vendor, CMS binding, or unrelated custom attributes. Do not add project fallback selectors to reusable code. Editing attributes never authorizes custom-code changes or publication.
