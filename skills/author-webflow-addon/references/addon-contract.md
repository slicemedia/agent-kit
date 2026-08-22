# Addon contract

The definition is the source of truth for runtime behavior, generated documentation, CLI explanation, and agent context.

## Metadata

- Stable neutral name, semantic version, and useful description
- Typed defaults without site values
- Every accepted `data-wft-*` attribute and value
- Runtime and optional vendor dependencies
- Body-end placement unless an earlier load is technically required
- Project-owned ESM entry point; no package-global registration

## Lifecycle

- Repeated `init` calls do not duplicate work.
- `refresh` reconciles DOM and options without replacing unrelated state.
- `destroy` removes owned work and restores prior DOM state.
- `setOptions` merges and validates partial options before reconciliation.
- `getState` returns serializable diagnostics.
- `on` returns an unsubscribe function.

Prefer one owned state record per root element. A singleton needs an explicit reason and contract.
