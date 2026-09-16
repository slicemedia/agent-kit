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

## Mutation gate

Before every registration, application, update, removal, replacement, or deletion, present the exact bounded target and operations, pre-state digest, preserved entries or bytes, blast radius, and recovery limitations. Ask the user to save all current Webflow changes and create a new native Webflow restore point, or explicitly waive it after those limits are explained, then hard-stop for a new reply. Existing, automatic, or historical backups, activity history, read-back, snapshots, and advance approvals do not count.

Only after that reply, re-read all affected custom-code state and ask for a separate final confirmation immediately before the first write. The recovery reply cannot double as write confirmation. Restart the gate if state or scope changed; one gate covers only its unchanged bounded batch. Registered-script deletion remains irreversible even after a site restore point, so state that limitation explicitly.
