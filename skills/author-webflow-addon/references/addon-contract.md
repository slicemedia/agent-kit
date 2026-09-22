# Addon contract

The definition is the source of truth for runtime behavior, generated documentation, CLI explanation, and agent context.

## Metadata

- Stable neutral name, semantic version, and useful description
- Typed defaults without site values
- Every accepted `data-wft-*` attribute and value
- Runtime and optional vendor dependencies
- Body-end placement unless an earlier load is technically required
- Project-owned ESM entry point; no package-global registration

## Attribute namespaces and ownership

For a new addon with markup hooks, choose one stable lowercase, hyphen-separated namespace aligned
with its neutral addon name. Inspect the project's existing definitions and markup before choosing it. Use
`data-wft-<addon>` for the root and `data-wft-<addon>-<role-or-option>` for owned children,
controls, settings, and state. Services without markup need no invented root hook. Different addons need distinct namespaces. Avoid generic names
such as `data-wft-item`, `data-wft-speed`, or `data-wft-duration` for addon-owned behavior.

```html
<section data-wft-reveal data-wft-reveal-duration="600">
  <div data-wft-reveal-item data-wft-reveal-delay="100"></div>
</section>
<span data-wft-countup data-wft-countup-duration="1200">100</span>
```

Every instance of the same addon reuses its namespace; do not add page names, folder names, or
instance numbers to attribute names. Put per-instance settings on the root and per-item overrides
on owned children, with documented types, units, and defaults. Separate stable item IDs are needed
only when the behavior requires identity, such as CMS slide reconciliation.

Scope queries and delegated events to the owning root. For nested instances of one addon, require
the candidate's closest matching addon root to be the current root; `root.querySelectorAll()` alone
also finds nested instances' children. When intentionally sharing roles across addon types,
define the boundary across all participating roots. Test sibling instances, nested instances, and
two different addons on the same page or element without settings, controls, or cleanup crossing
owners.

Shared adapter/vendor hooks are deliberate exceptions, not activation selectors for every addon
using that vendor. Document their owner, purpose, consumers, and scope, and keep one lifecycle
owner per vendor instance or mutable behavior. One element may carry multiple independent addon
contracts; each addon must preserve the other's state. Preserve established names and third-party hooks unless migration is
requested; coordinate any rename across runtime selectors, option mappings, metadata, markup,
and setup documentation. Do not silently rename working markup to satisfy this convention.

Declare concrete attribute names in the supported metadata fields. DevKit validates `data-wft-*`
syntax; it does not infer a namespace from the addon name or folder, prefix attributes, or make
arbitrary selectors safe automatically.

## Entry organization

Mark new browser entry files with `.entry.ts` / `.entry.js` (TSX/MJS also work). For example,
`src/addons/animations/counter.entry.ts` builds to `dist/addons/animations/counter.js`;
`src/addons/sliders/gallery/index.entry.ts` builds to `dist/addons/sliders/gallery/index.js`.
The entry can contain the whole addon or import ordinary helper files. Helpers in nested folders
do not become public bundles. Legacy `src/addons/<name>.ts` and `<name>/index.ts` entries still
build to `dist/addons/<name>.js`; keep helpers out of those positions or prefix them with `_`.
Discovery skips underscore/dot-prefixed paths and test/type declaration files.

Public names default to the file stem, or the parent folder for a nested `index.entry.ts`, and must stay
unique across folders. Rename colliding entries or configure distinct names aligned with runtime
registration. Moving marked entries changes their URLs: rebuild, deploy the complete directory
tree, and update affected embeds. Derive tags from `explain`/`catalog` and the actual build manifest.
The CLI computes shared vendor paths at every output depth; no per-addon vendor URL is needed.
Older CLIs without recursive marker discovery require explicit configured inputs/output paths.

## Inspection contract

Check the installed DevKit API before adding inspection fields; older versions may need an update.
In versions supporting the inspection API:

- Put element roles, parent/child relationships, required attributes, conditions, cardinality, unique keys, references, and supported value constraints in the shared definition's `structure` and attribute metadata. Use `scope: "global"` for services without component markup. Requirements are exposed through `instance.definition` and `getAddonMetadata(definition)`; comments are not the contract.
- Map the inert definition to its browser entry in `devkit.config.json` so `explain` and `catalog` consume the same requirements as DevTools. Keep importing the definition free of startup effects.
- Use `context.resolveOptions(root)` in behavior and diagnostics so per-root attribute overrides and configured defaults agree. Declare `attribute.option` mappings or an explicit synchronous resolver rather than duplicating option parsing in the inspector.
- Expose synchronous, read-only `inspect(context)` reports on the definition or setup hooks for actual runtime state, semantic issues, and dependency readiness. Consumers can call `instance.inspect(root?)`. Do not initialize vendors, mutate DOM, fetch data, or return promises from inspection. Report unavailable facts as unverified.
- Initialize through `initializeAddon(runtime, instance)` so inspection can retain startup failures while public API registration and readiness remain success-only. The inspector does not call lifecycle methods or `getState` to discover state.
- Treat DevTools as optional. Suggest it for debugging declared requirements and per-instance reports; a clean snapshot does not establish that behavior works.

## Lifecycle

- Repeated `init` calls do not duplicate work.
- `refresh` reconciles DOM and options without replacing unrelated state.
- `destroy` removes owned work and restores prior DOM state.
- `setOptions` merges and validates partial options before reconciliation.
- `getState` returns serializable diagnostics.
- `on` returns an unsubscribe function.

Prefer one owned state record per root element. A singleton needs an explicit reason and contract.
