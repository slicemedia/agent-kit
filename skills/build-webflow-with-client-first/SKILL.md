---
name: build-webflow-with-client-first
description: Plan, create, extend, or review Webflow pages, layouts, classes, and reusable components with Finsweet Client-First when the user explicitly selects it or the inspected project already follows it. Do not use for sites following another methodology unless the user asks for a migration plan.
---

# Build Webflow with Client-First

Webflow MCP version: 2.0.1.

Treat Client-First as a project convention, not a universal Webflow requirement. A familiar class name is not enough evidence. Do not install or introduce Finsweet Attributes, Finsweet Components, cloneable content, global CSS, or another Finsweet product merely because this skill applies.

## Workflow

1. Resolve the exact site, branch, and page. Read site Agent Instructions and the project guide before planning changes.
2. Confirm Client-First from an explicit user choice or a representative cluster of existing structure, class, style-guide, and global-style evidence. If the site uses Client-First v1, a customized v2 system, another methodology, or a mixed system, describe the evidence and preserve it until the user chooses a migration strategy.
3. Inspect the relevant element tree, classes and class order, styles, variables, breakpoints, native Webflow components, properties, variants, slots, CMS bindings, custom attributes, interactions, and custom code. Use the Designer bridge only for live canvas context or snapshots.
4. Read [Client-First conventions](references/client-first-conventions.md) when choosing structure, class scope, folders, utilities, variants, spacing, or responsive behavior. Treat the live project and current official documentation as authoritative over examples.
5. Produce a plan containing:
   - the semantic page and component tree;
   - a class ledger showing reused and proposed classes, type, scope, and shared blast radius;
   - existing and proposed variables or tokens;
   - native Webflow component, property, variant, slot, and CMS decisions;
   - breakpoint, accessibility, content-extreme, and behavior-hook checks.
6. Prefer existing project utilities, variables, and components. Keep `data-wft-*` attributes for behavior hooks, never as styling classes. Distinguish a Client-First `_component` root from an actual native Webflow Component definition.
7. Before any remote write, show the bounded operations and obtain explicit confirmation. Use the focused headless `data_*` tools, apply in reviewable batches, and read back each batch. Preserve identifiers, class-stack order, bindings, attributes, and unrelated state.
8. Verify semantic structure, Navigator clarity, class reuse, breakpoint cascades, arbitrary widths, CMS empty and long-content states, keyboard behavior, focus, reduced motion, and published-stage behavior where requested. Restore the original Designer page or component view after temporary navigation.
9. Return a receipt with evidence, changes, preserved state, unresolved manual work, errors or partial failures, and `published: false`. Add an editor-facing handoff identifying which controls belong to a page element, component instance, every component instance, CMS item/template, shared class or variable, behavior hook, or local composition entry. Editing and publishing are separate workflows.

## Migration boundary

A site-wide Client-First conversion, class purge, or bulk rename is a separate high-risk migration. First inventory all pages, breakpoints, shared styles, native components, CMS bindings, custom attributes, interactions, and runtime selectors. Present convert, rebuild, and retain-as-is options. Never normalize a mixed system or delete apparently unused classes without explicit scope, dependency checks, a confirmed manual Webflow restore point or recorded waiver, write confirmation, and staged verification.

## Stop conditions

Stop on uncertain methodology, ambiguous shared scope, stale inspection state, unresolved props or bindings, unexpected cross-page usage, tool-schema uncertainty, insufficient permissions, or `ModeForbidden`. Do not bypass a restriction with a broader tool. Webflow MCP 2.0.1 does not make every Designer operation or interaction-authoring workflow remotely available; report the manual handoff instead of claiming completion.
