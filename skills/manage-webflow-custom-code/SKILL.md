---
name: manage-webflow-custom-code
description: Explicitly inspect, plan, and perform bounded Webflow custom-code changes through Webflow MCP with preservation checks and read-back. Use only when the user directly asks to register, apply, update, remove, or replace site/page custom code.
metadata:
  surfaces: [local-agent]
---

# Manage Webflow Custom Code

Webflow MCP version: 2.0.1.

Use the official `data_scripts_tool`. The Slice Media DevKit CLI does not write Webflow custom code.

## Required sequence

1. Identify the exact site and optional page. Read registered scripts, applied site/page scripts, and affected freeform blocks before planning.
2. Separate registration from application. Prefer additive `add_site_script` or `add_page_script` when it expresses the request.
3. Treat `set_*_scripts`, `clear_*_scripts`, and `set_*_freeform_code` as full-scope replacements. Include every preserved entry or byte in the reviewed plan.
4. Validate immutable HTTPS URLs, version, integrity, placement, and the exact target. Treat registered-script deletion as irreversible.
5. Present exact additions, updates, removals, preserved state, risk tier, and publication status. A full-scope replacement, freeform overwrite, or registered-script deletion requires a confirmed manual Webflow restore point or an explicit recorded waiver.
6. Require explicit confirmation of that exact snapshot and target.
7. Apply only the confirmed operation once. Do not retry an ambiguous write or convert omission into deletion.
8. Re-read registration, application, and freeform state. Return a receipt with requested changes, preserved entries, recovery checkpoint, mismatches, errors, and `published: false` unless a separate publish operation was explicitly completed. Add an editor-facing handoff naming site/page scope, script or freeform ownership, source repository/control surface, affected pages, and the separate publication step.

Read [the safety model](references/safety-model.md) before applying.

## Fail closed

Stop on an unspecified target, mutable hosted URL, missing integrity, insufficient permission, pagination uncertainty, stale pre-state, or an operation that would overwrite unrelated code.
