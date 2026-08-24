---
name: author-webflow-addon
description: Design, implement, test, and document a reusable Webflow browser enhancement with the @slicemedia/devkit-addon lifecycle. Use when creating project behavior, extracting a neutral addon, changing addon metadata, or reviewing lifecycle safety.
metadata:
  surfaces: [local-agent]
---

# Author Webflow Addon

Build a neutral enhancement in the consuming project unless several independent projects already need the same behavior.

## Workflow

1. Inspect the markup and state the smallest semantic `data-wft-*` contract. If markup is unavailable, label reference markup as an assumption.
2. Start from `@slicemedia/devkit-addon/example`; import that subpath explicitly. Never import an example from the package root or make it part of production composition.
3. Define metadata first: stable name and version, description, attributes, typed default options, dependencies, placement, and entry point.
4. Implement idempotent `init`, reconciling `refresh`, complete `destroy`, `setOptions`, and serializable `getState`. Use typed events where observable state helps diagnostics.
5. Track every owned listener, observer, timer, vendor instance, generated node, and DOM mutation. Restore original state on destroy.
6. Keep imports inert. Initialize the addon only from the consumer's `src/main.ts`.
7. Test missing and delayed DOM, multiple instances, CMS mutation, keyboard use, and destroy/reinitialize. Add breakpoint and reduced-motion cases when used.
8. Return an editor-facing handoff that identifies the markup hooks, project options, source entry, affected instances/pages, tests completed, unverified cases, and `published: false`.

Read [the addon contract](references/addon-contract.md) before changing the public lifecycle.

## Boundaries

- Do not embed site IDs, domains, component identifiers, account IDs, client copy, project URLs, or fallback selectors.
- Prefer native Webflow behavior where it meets the requirement.
- Keep optional vendors outside core and add them only to projects that use them.
- Do not change Webflow or publish as part of addon authoring without a separate explicit request.
