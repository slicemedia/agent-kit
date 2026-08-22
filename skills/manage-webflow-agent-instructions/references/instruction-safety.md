# Agent Instruction safety

- Rules and skills are different instruction kinds and follow different path grammars.
- Read resolved and raw content when references or exact preservation matter.
- Updating omitted fields preserves them; do not replace an entire instruction unnecessarily.
- A move must stay within the parent constraints accepted by the current MCP schema.
- Deleting a skill's `SKILL.md` cascades to descendant resources and requires an explicit warning.
- Site instructions can affect every connected agent and shared-library instructions can affect multiple sites.
- Never include credentials, personal data, client history, or local absolute paths.
- Read-back validates path, kind, content digest, and reference resolution; it does not publish a site.
