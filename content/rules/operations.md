# Webflow operation rules

- Use local development tools for builds, diagnostics, sanitization, catalogs, explanations, and read-only inspection only.
- Use Webflow MCP 2.0.1 for remote Webflow changes. Follow `inspect → plan → confirm → apply → read back → verify` and preserve unrelated state.
- Treat component definitions, component instances, exposed properties, variants, shared classes, CMS records, locales, and publication state as distinct scopes.
- Assign a change-risk tier before remote writes. High-blast structure, deletion, shared-style, shared-component, variable, schema, or bulk changes require a manually confirmed Webflow restore point or an explicit recorded waiver. A snapshot is evidence, not a backup.
- Do not infer permission to write or publish from a request to inspect, build, test, or explain.
- Keep tokens and target identifiers in ignored environment files or the connected OAuth session; redact them from plans, receipts, fixtures, and logs.
- DigitalOcean Spaces deployment is optional and belongs to `@slicemedia/spaces-deployer`. Review an immutable, versioned deployment plan before explicitly confirmed application.
- End changed or reviewable work with an editor-facing scope handoff that states what changed, what remains editable, who or what is affected, verification evidence, publication state, and recovery guidance.
