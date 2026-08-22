# Webflow development workspace guidance

This workspace builds reusable, narrowly scoped browser behavior for Webflow projects. Reusable
packages own runtime code; consuming projects own markup contracts, composition, content,
identifiers, and hosting choices.

## Boundaries

- Prefer Webflow-native layout, components, CMS, forms, variables, and interactions. Add browser code only where Webflow does not provide the required behavior.
- Use neutral `data-wft-*` hooks. Never introduce client names, assets, URLs, site IDs, component IDs, credentials, copied production markup, or project fallback selectors.
- Keep package ESM imports side-effect-free. A consumer's composition entry is the only place that selects and initializes browser behavior.
- Make lifecycle initialization idempotent and destruction complete. Preserve DOM, attributes, accessibility state, and remote data that the code does not own.
- Treat inspection, planning, confirmation, application, read-back, and verification as separate phases. Webflow writes, deletion, and publishing require an explicit user request and the matching MCP skill.
- Require a confirmed manual Webflow restore point or an explicit recorded waiver before high-blast structure, deletion, shared design-system, schema, or bulk changes. A visual snapshot is not a backup.
- Keep hosting and deployment integrations optional; reusable browser packages must not assume a provider or target.

Use the official Webflow MCP server and pinned official Webflow skills for broad Designer, CMS,
custom-code, audit, and publishing workflows. Load the smallest matching generated skill before
specialized work.
