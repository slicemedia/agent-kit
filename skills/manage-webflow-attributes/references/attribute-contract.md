# Attribute contract

- A behavior hook starts with `data-wft-` and has one documented owner.
- Presence-only hooks use an empty value unless metadata defines another form.
- Enumerated and numeric values are validated before writing.
- Existing unrelated attributes remain byte-for-byte unchanged.
- Bound attributes are not replaced with static values without separate explicit approval.
- Repeated instances receive independent identifiers only when the runtime contract requires them.
- Removing a hook is a behavior change and must be verified against the loaded project bundle.
- The receipt records structured element ID, prior value, requested value, result, and read-back value.
