---
name: author-webflow-addon
description: Design, implement, test, and document a reusable Webflow browser enhancement with the @slicemedia/devkit-addon lifecycle. Use when creating project behavior, extracting a neutral addon, changing addon metadata, or reviewing lifecycle safety.
metadata:
  surfaces: [local-agent]
---

# Author Webflow Addon

Build a neutral enhancement in the consuming project unless several independent projects already need the same behavior.

## Workflow

1. Inspect existing addon metadata and markup. When markup hooks are needed, choose a distinct, stable `data-wft-<addon>` root and `data-wft-<addon>-<role-or-option>` hooks. Follow [attribute namespaces and ownership](references/addon-contract.md#attribute-namespaces-and-ownership), including shared-hook exceptions and existing-contract compatibility. If markup is unavailable, label reference markup as an assumption.
2. Start from the consuming project's ignored feature/entry templates when available, or `@slicemedia/devkit-addon/example`; import that subpath explicitly. Never import an example from the package root or make it part of production composition.
3. Define metadata first: stable name and version, description, attributes, typed default options, dependencies, placement, and entry point. For versions supporting the inspection API, declare nested roles, conditional requirements, counts, and constraints in shared `structure` metadata so DevTools, `explain`, and `catalog` agree. Map the inert definition to its browser entry in `devkit.config.json`.
4. Implement idempotent `init`, reconciling `refresh`, complete `destroy`, `setOptions`, and serializable `getState`. Use typed events where observable state helps diagnostics.
5. Track every owned listener, observer, timer, vendor instance, generated node, and DOM mutation. Scope child queries and delegated events to the owning root, excluding nested instances. Restore original state on destroy.
6. Keep package and reusable-module imports inert. Mark new consumer-owned browser entries with `.entry.ts` or `.entry.js` under `src/addons/`; optional category folders may nest. The entry explicitly initializes and registers the API and builds independently at the matching path under `dist/addons/`, with `.entry` removed and optional adjacent CSS. Keep entry names unique across folders. Check the installed CLI's supported conventions in older projects. When supported, use `initializeAddon(runtime, instance)` to retain startup failures for inspection while exposing public readiness only after successful initialization. Use optional project entries only for deliberate composition. Expose small-script access through the shared window runtime and document lifecycle events and readiness.
7. Test missing and delayed DOM, repeated and nested instances, coexistence with another addon, CMS mutation, keyboard use, and destroy/reinitialize. Confirm configuration and controls cannot cross owners. Add breakpoint and reduced-motion cases when used. Suggest optional DevTools to inspect declared requirements and runtime reports on the rendered page; verify the actual behavior separately.
8. Return an editor-facing handoff that identifies the markup hooks, project options, source entry, individual local/production script and stylesheet tags, public API/events, affected instances/pages, tests completed, unverified cases, and `published: false`.

Read [the addon contract](references/addon-contract.md) before changing the public lifecycle or inspection contract.
Its entry-organization section also explains helper files, folder entries, and compatibility.

## Boundaries

- Do not embed site IDs, domains, component identifiers, account IDs, client copy, project URLs, or fallback selectors.
- Keep layout, content, and base styling Webflow-native. Prefer GSAP addons for custom animation work, honoring the user's chosen approach first; simple CSS effects and straightforward Designer-owned Interactions remain suitable alternatives. Do not require proof that native Interactions are incapable before authoring a requested GSAP addon.
- Keep optional vendors outside core and add them only to projects that use them.
- Do not change Webflow or publish as part of addon authoring without a separate explicit request.
