# Agent Instruction safety

- Rules and skills are different instruction kinds and follow different path grammars.
- Read resolved and raw content when references or exact preservation matter.
- Updating omitted fields preserves them; do not replace an entire instruction unnecessarily.
- A move must stay within the parent constraints accepted by the current MCP schema.
- Deleting a skill's `SKILL.md` cascades to descendant resources and requires an explicit warning.
- Site instructions can affect every connected agent and shared-library instructions can affect multiple sites.
- Never include credentials, personal data, client history, or local absolute paths.
- Read-back validates path, kind, content digest, and reference resolution; it does not publish a site.

## Mutation gate

Before every create, update, move, or delete, present the exact bounded paths and content digests, blast radius, preserved state, and recovery limitations. Ask for a new native Webflow restore point after current changes are saved, or an informed explicit waiver, and hard-stop for a new user reply. Old or automatic backups, activity history, snapshots, and advance approval do not count.

Only after that reply, re-read affected paths and ask for a separate final confirmation immediately before the first write. The recovery reply cannot double as write confirmation. Restart the gate if content or the plan changed; one gate covers only its unchanged bounded batch.
