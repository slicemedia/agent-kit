# Webflow operation rules

- Use local development tools for builds, diagnostics, sanitization, catalogs, explanations, and read-only inspection only.
- Use Webflow MCP 2.0.1 for remote Webflow changes. Follow `inspect → exact bounded plan → recovery checkpoint → separate final confirmation → apply → read back → verify` and preserve unrelated state.
- Treat component definitions, component instances, exposed properties, variants, shared classes, CMS records, locales, and publication state as distinct scopes.
- Before any non-publication Webflow-hosted mutation, inspect current state and show the exact target identifiers, operations, blast radius, preserved state, and recovery limits. Ask the user to save all current changes and create a new native Webflow restore point, or explicitly waive it after those limits are explained. Hard-stop for a new user reply confirming completion or waiver. An earlier, automatic, or historical backup, activity history, snapshot, or advance approval does not count.
- Only after that reply, re-check that state and the plan are unchanged and ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot double as final write confirmation. Restart the gate if state or scope changes; one gate may cover only an unchanged bounded batch.
- For CMS creates or edits, offer the optional agent-tracking fields, write them only after explicit opt-in, and allow refusal; never create tracking schema silently. Before creating an item on a localized site, explicitly confirm the locale set, recommend all configured locales, and stop rather than silently fall back to primary-only when the tool cannot express that scope.
- Do not infer permission to write or publish from a request to inspect, build, test, or explain.
- Keep tokens and target identifiers in ignored environment files or the connected OAuth session; redact them from plans, receipts, fixtures, and logs.
- DigitalOcean Spaces deployment is optional and belongs to `@slicemedia/spaces-deployer`. Review an immutable, versioned deployment plan before explicitly confirmed application.
- Editing never authorizes publication; the dedicated publishing workflow has its own scope and confirmation.
- End changed or reviewable work with an editor-facing scope handoff that states what changed, what remains editable, who or what is affected, verification evidence, publication state, and recovery guidance.
