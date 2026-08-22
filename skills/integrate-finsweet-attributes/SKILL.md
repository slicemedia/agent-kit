---
name: integrate-finsweet-attributes
description: Plan, integrate, audit, or debug Finsweet Attributes solutions in Webflow when a requested behavior fits Attributes or an existing fs-* setup needs work. Do not use for Client-First styling, Finsweet Components, or Slice Media DevKit addon authoring.
---

# Integrate Finsweet Attributes

Webflow MCP version: 2.0.1.

Treat Finsweet Attributes as an optional third-party runtime, not a default project dependency. Select a solution from the current official documentation for the requested behavior; never infer that another Finsweet product is also wanted.

## Product boundaries

- **Client-First** is a class, structure, and style convention. It neither installs nor configures Attributes.
- **Finsweet Attributes** provides attribute-driven JavaScript solutions. Its `fs-*` hooks and runtime remain vendor-owned.
- **Finsweet Components** is a separate app-managed component product. Do not install, license, replace, or configure it through this skill.
- **Slice Media DevKit addons** are project-bundled code with neutral `data-wft-*` contracts. Do not rename `fs-*` hooks to `data-wft-*` or wrap an Attributes solution as a DevKit addon without a separate authoring decision.

When native Webflow behavior already meets the requirement, prefer it. If multiple products could solve the problem, compare ownership, CMS needs, accessibility, lifecycle control, maintenance, and cost before asking the user to choose.

## Workflow

1. Resolve the exact site, branch, page, and requested outcome. Read the site's Agent Instructions and inspect the relevant published behavior before proposing a product.
2. Read [the integration reference](references/integration-guide.md) and the current official page for the candidate solution. Confirm that it supports the required elements, CMS/static data source, solution combinations, and API needs.
3. Inspect the complete existing contract:
   - site- and page-level registered scripts, applied scripts, and freeform head/footer code;
   - every relevant `fs-*` attribute, its element type, value, binding, inherited setting, instance, and repeated component/CMS scope;
   - current script URL, major/exact version, module and loading attributes, declared solution keys, placement, and load order;
   - project code using the Attributes global API, callbacks, hooks, restarts, observers, or DOM mutation handling;
   - duplicate or legacy scripts and overlapping native, Components, or DevKit behavior.
4. Classify every affected rendered page as a clean current integration, an intentional legacy integration, a migration target, or a new integration, while accounting for scripts inherited from site-wide custom code. V1 and v2 must not run together on the same page. Different pages may intentionally remain on different major versions; document that boundary instead of forcing a site-wide migration. Never silently upgrade a legacy page or add a second universal v2 script call.
5. Present a plan before any write. Include the selected solution and why, verified documentation/version snapshot, exact script ownership and placement, load-order contract, element and setting attributes, instances, preserved attributes/bindings, CMS field mapping, runtime interop, accessibility/fallback behavior, staging tests, rollback path, and shared blast radius. For broad script replacement/removal or shared/bulk attribute changes, require a confirmed manual Webflow restore point or an explicit recorded waiver; snapshots and read-back are evidence, not backups.
6. Obtain explicit confirmation for the bounded remote writes and, when required, the restore point or waiver. Use focused headless `data_*` tools; reserve the Designer bridge for live canvas context or snapshots. Script registration and application are separate operations. If required `fs-*` attributes on the script tag cannot be represented by the registered-script interface, treat the containing freeform block as a full replacement and preserve all unrelated bytes in the reviewed plan.
7. Apply in small batches, then read back each batch. Preserve element IDs, structured IDs, CMS bindings, component props, unrelated classes and attributes, script entries, and custom code. Do not publish as part of editing.
8. Verify on an explicitly approved staging publication because Attributes behavior depends on published output. Test multiple instances, initial/empty/error states, CMS pagination and dynamically rendered items, long and optional content, query parameters, keyboard use, focus, names/labels, reduced motion, narrow widths, slow/failed script loading, and interaction with existing project code.
9. Return a receipt with inspected version and solution keys, exact mutations, preserved state, read-back evidence, staging evidence, partial failures, remaining manual work, and publication state. Add an editor-facing handoff naming whether future changes belong to an `fs-*` hook, inherited setting, CMS field, component instance/definition, script declaration, or project callback and what other instances or pages that control affects.

## Lifecycle and duplicate-initialization rules

- For current v2 work, maintain one universal library call per page and declare only the required solutions. Update the existing call instead of pasting another copy.
- Prefer explicit solution declarations when predictable loading matters. Use automatic discovery only after documenting its later DOM scan and accepting that tradeoff.
- Use the current solution API for dynamic content and post-render work. Do not repeatedly reload the whole library from a generic mutation observer.
- Register project callbacks, hooks, and listeners once. Record and remove project-owned subscriptions during teardown or hot reload; use an official solution restart only when its documented lifecycle requires it.
- Recheck the live API before writing custom integration code. Do not use a legacy global or callback shape in a v2 integration.

## Stop conditions

Stop before mutation on an uncertain target, undocumented solution combination, v1 and v2 running on the same rendered page, duplicate library ownership, an unexplained cross-page version boundary, ambiguous inherited setting, unresolved CMS binding or instance pairing, unknown custom callback/restart code, inaccessible required control, shared component blast radius without approval, missing required restore point or waiver, stale inspection, insufficient permissions, tool-schema uncertainty, or `ModeForbidden`. If staging cannot be published or inspected, report the integration as unverified rather than claiming success.
