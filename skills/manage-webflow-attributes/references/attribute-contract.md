# Attribute contract

- A behavior hook starts with `data-wft-` and has one documented owner.
- Presence-only hooks use an empty value unless metadata defines another form.
- Enumerated and numeric values are validated before writing.
- Existing unrelated attributes remain byte-for-byte unchanged.
- Bound attributes are not replaced with static values without separate explicit approval.
- Repeated instances receive independent identifiers only when the runtime contract requires them.
- Removing a hook is a behavior change and must be verified against the loaded project bundle.
- The receipt records structured element ID, prior value, requested value, result, and read-back value.

## Mutation gate

Before every attribute mutation, inspect current values and present the exact bounded operations, structured element IDs, repeated/shared consumers, preserved attributes and bindings, and recovery limitations. Ask for a new native Webflow restore point after current changes are saved, or an informed explicit waiver, then hard-stop for a new user reply. Existing or automatic backups, history, snapshots, and advance approval do not count.

Only after that reply, re-read target attributes and ask for a separate final confirmation immediately before the first write. The recovery reply cannot double as write confirmation. Restart the gate if state or scope changed; one gate covers only its unchanged bounded batch.
