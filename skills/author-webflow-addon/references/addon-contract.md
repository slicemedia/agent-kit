# Addon contract

The definition is the source of truth for runtime behavior, generated documentation, CLI explanation, and agent context.

## Metadata

- Stable neutral name, semantic version, and useful description
- Typed defaults without site values
- Every accepted `data-wft-*` attribute and value
- Runtime and optional vendor dependencies
- Body-end placement unless an earlier load is technically required
- Project-owned ESM entry point; no package-global registration

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

## Lifecycle

- Repeated `init` calls do not duplicate work.
- `refresh` reconciles DOM and options without replacing unrelated state.
- `destroy` removes owned work and restores prior DOM state.
- `setOptions` merges and validates partial options before reconciliation.
- `getState` returns serializable diagnostics.
- `on` returns an unsubscribe function.

Prefer one owned state record per root element. A singleton needs an explicit reason and contract.
