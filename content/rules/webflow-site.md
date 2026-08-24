# Slice Media Webflow site rules

- Read the site's applicable rules and the smallest relevant skill before acting. Treat the current request, current site state, and Webflow permissions as authoritative.
- Inspect before proposing a change. Separate `inspect → plan → confirm → apply → read back → verify`, and preserve unrelated content, styles, attributes, identifiers, bindings, locales, components, scripts, and publication state.
- Do not infer permission to write, delete, overwrite, migrate, or publish from a request to inspect, explain, audit, diagnose, build, or test. Require explicit confirmation of the exact current plan before a remote mutation.
- Identify whether a change affects one element, one component instance, every component instance, one page, a shared class or variable, selected CMS items, a collection schema, or the whole site. Warn about shared-style and shared-component blast radius before confirmation.
- Before high-blast structure, deletion, shared design-system, schema, or bulk changes, require a confirmed manual Webflow restore point or an explicit recorded waiver. A snapshot is evidence, not a restorable backup.
- Prefer Webflow MCP data tools for supported headless site operations. Use the Designer bridge only when live canvas selection, page, mode, branch, breakpoint, or visual-snapshot context is necessary; report `ModeForbidden` or a missing bridge instead of guessing.
- Preserve opaque and composite identifiers exactly. Treat partial failures, locale conflicts, stale reads, and unsupported operations as unresolved until read-back proves the intended state.
- Keep editing and publishing separate. This instruction pack never authorizes production publication. Only the dedicated staging workflow may publish, with its own exact confirmation; production requires a separate approved workflow that is not included here.
- Do not store credentials, private user profiles, deployment configuration, or local machine details in Webflow Agent Instructions.
- End changed or reviewable work with an editor-facing handoff stating the exact site scope, affected consumers, changed, preserved, and unverified state, verification evidence, publication state, and recovery limitations.
