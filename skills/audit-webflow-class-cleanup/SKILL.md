---
name: audit-webflow-class-cleanup
description: Audit Webflow classes across site structure, components, CMS, custom code, local runtime code, interactions, and rendered pages, then plan a guarded cleanup. Use only when the user directly asks for a class-usage audit, class cleanup, or class removal.
metadata:
  surfaces: [local-agent]
---

# Audit Webflow Class Cleanup

Webflow MCP version: 2.0.1.

An audit is read-only. A list of apparently unused classes is not authorization or proof that any class is safe to remove.

The recovery and confirmation gate below applies to every Webflow-hosted mutation this skill can perform, regardless of risk.

## Required workflow

1. Resolve the exact site, branch or staging context, local codebase, and requested scope. Read site Agent Instructions. Inventory every class and combo path with `data_style_tool`, including every breakpoint, pseudo-state, and variable-mode override.
2. Search all static and dynamic reference surfaces before classifying anything: every page and element; native component definitions and instances; props and variants; CMS template structures, bindings, locales, and custom attributes; embeds; site/page custom code and registered scripts; interactions; local source and built runtime files; and representative rendered pages at all project breakpoints.
3. Account for runtime-composed names, conditional visibility, CMS content extremes, localized content, hover/focus states, combo parents, and third-party selectors. Webflow MCP cannot fully inspect or apply Interactions; incomplete interaction evidence is a blocker to a deletion claim, not evidence of non-use.
4. Classify each reviewed selector as `protected`, `conditional`, or `no-reference-found` using [the audit model](references/class-cleanup-audit.md). Never label a selector `safe`, and never treat Webflow's purge candidate list or a text-search miss as sufficient evidence for removal.
5. Present an evidence ledger with coverage gaps, reference locations, dependency chains, risk, proposed validation, and a keep-or-review recommendation. Stop after the audit unless the user separately asks for removal.
6. Before any removal, present the exact bounded selector identities, target IDs, blast radius, preserved state, coverage gaps, validation plan, and recovery limitations. Ask the user to save all current Webflow changes and create a new native Webflow restore point, or explicitly waive it after those limits are explained. Hard-stop for a new reply confirming completion or waiver. Existing, automatic, or historical backups, activity history, snapshots, and advance approvals do not count. A Webflow restore is site-wide recovery, not selector-level rollback; never trigger one automatically.
7. After that reply, re-read affected selectors and dependencies. Restart the gate if state or the removal plan changed. Otherwise ask for a separate final confirmation of the exact removal set immediately before the first write. The restore-point or waiver reply cannot double as write confirmation. Remove only confirmed selectors in the unchanged bounded batch, never cascading to combo parents or related selectors merely because the tool permits it. Stop on stale state, partial failure, unexpected dependency, or an uninspected surface.
8. Re-read class and element state, then verify components, CMS templates and representative items, localized variants, interaction behavior, local enhancements, and rendered pages across every breakpoint and relevant state. Return a receipt that separates removed, preserved, failed, and unresolved selectors. Add an editor-facing handoff naming each affected class or combo scope, where future style changes belong, shared consumers, verification state, recovery checkpoint, and `published: false`.

## Fail closed

Keep a class `protected` or `conditional` when coverage is incomplete, a selector is dynamically assembled, a component or CMS path is unresolved, interaction evidence is unavailable, the rendered environment differs from the inspected project, or the recovery checkpoint and separate removal confirmation do not match the current plan. Editing never authorizes publishing.
