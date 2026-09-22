# Attribute contract

- New addon contracts use a stable neutral `data-wft-<addon>` root and `data-wft-<addon>-<role-or-option>` hooks, with a distinct namespace per addon and one documented owner. Check existing metadata and markup for collisions; `data-wft-` alone does not isolate addons.
- Repeated instances of the same addon reuse attribute names. The runtime scopes children, controls, and options to their owning root, excluding nested instances. Do not invent a namespace for each page, folder, or component instance.
- Use the installed addon's exact documented names. Keep deliberate adapter/vendor hooks shared only as their contract specifies; do not rename third-party hooks or existing addon attributes merely to adopt the convention. A rename needs matching runtime selectors, option mappings, metadata, and setup documentation.
- Presence-only hooks use an empty value unless metadata defines another form.
- Enumerated and numeric values are validated before writing.
- Existing unrelated attributes remain byte-for-byte unchanged.
- Bound attributes are not replaced with static values without separate explicit approval.
- Repeated instances receive independent identifiers only when the runtime contract requires them.
- Removing a hook is a behavior change and must be verified against every loaded addon or optional project script that uses it.
- The receipt records structured element ID, prior value, requested value, result, and read-back value.

For new or revised addon contracts, read the [namespace and ownership guidance](../../author-webflow-addon/references/addon-contract.md#attribute-namespaces-and-ownership).

## Mutation gate

Before every attribute mutation, inspect current values and present the exact bounded operations, structured element IDs, repeated/shared consumers, preserved attributes and bindings, and recovery limitations. Ask for a new native Webflow restore point after current changes are saved, or an informed explicit waiver, then hard-stop for a new user reply. Existing or automatic backups, history, snapshots, and advance approval do not count.

Only after that reply, re-read target attributes and ask for a separate final confirmation immediately before the first write. The recovery reply cannot double as write confirmation. Restart the gate if state or scope changed; one gate covers only its unchanged bounded batch.
