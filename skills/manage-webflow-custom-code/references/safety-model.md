# Custom-code safety model

- Registered, applied, freeform, page-level, and site-level code are separate state.
- Read all affected state immediately before planning and again before a broad replacement.
- Prefer one-script additive or removal actions over replace-all actions.
- Applying a registered script never implies publication.
- Omission preserves state unless the confirmed action explicitly removes or replaces it.
- Freeform setters replace an entire block; preserve unknown content byte-for-byte.
- Deleting a registered script is irreversible and may affect every applied version.
- Do not retry a write when the response is ambiguous; read back first.
- Receipts record the target, pre-state digest, requested changes, preserved entries, result, mismatches, and publication state.
- Broad replacement, freeform overwrite, and registered-script deletion require a confirmed manual Webflow restore point or an explicit waiver. Never treat read-back, activity history, or a visual snapshot as a restorable backup.
