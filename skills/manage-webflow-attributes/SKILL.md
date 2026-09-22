---
name: manage-webflow-attributes
description: Explicitly inspect, plan, and update neutral data-wft attributes on Webflow elements while preserving unrelated attributes and bindings. Use when connecting Designer markup to a Slice Media DevKit enhancement or auditing an existing behavior contract.
metadata:
  surfaces: [local-agent]
---

# Manage Webflow Attributes

Webflow MCP version: 2.0.1.

Use `data_element_tool` for attribute reads and writes. Attribute inspection is read-only; adding, changing, or removing a hook requires explicit confirmation.

The recovery and confirmation gate below applies to every Webflow-hosted mutation this skill can perform, regardless of risk.

## Workflow

1. Resolve the exact site, page, component scope, and target elements. Read relevant site Agent Instructions.
2. Read current attributes with bindings resolved when relevant. Preserve the returned structured element IDs.
3. Compare the requested addon metadata with the markup. Use its exact documented names and validated values. New contracts use `data-wft-<addon>` and `data-wft-<addon>-<role-or-option>` with a distinct prefix per addon; repeated instances reuse those names. Check other owners and deliberate shared hooks. Do not rename established hooks without a coordinated runtime migration or repurpose classes and DOM IDs as hidden behavior hooks.
4. Plan exact `set_attributes` and `remove_attribute` operations. List target identifiers, blast radius, every existing attribute and binding that remains untouched, and recovery limitations. Warn when the target is inside a shared component definition or when one edit will affect repeated CMS/component instances.
5. Ask the user to save all current Webflow changes and create a new native Webflow restore point, or explicitly waive it after the recovery limitations are explained. Hard-stop for a new reply confirming completion or waiver. Existing, automatic, or historical backups, activity history, snapshots, and advance approvals do not count.
6. After that reply, re-read target attributes and bindings. Restart the gate if state or the plan changed. Otherwise ask for a separate final confirmation of the exact plan and blast radius immediately before the first write. The restore-point or waiver reply cannot double as write confirmation; one gate covers only its unchanged bounded batch.
7. Apply the confirmed attributes, read them back, and return a per-element receipt with the recovery checkpoint, final confirmation, changes, preserved attributes, failures, and publication state. Add an editor-facing handoff naming the element/component scope, documented hook owner, editable values, repeated consumers, and local runtime entry that implements the behavior.

Read [the attribute contract](references/attribute-contract.md) before applying changes.

## Boundaries

Never overwrite `id`, accessibility, analytics, vendor, CMS binding, or unrelated custom attributes. Do not add project fallback selectors to reusable code. Editing attributes never authorizes custom-code changes or publication.
