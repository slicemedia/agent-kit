# Webflow development workspace guidance

This workspace builds reusable, narrowly scoped browser behavior for Webflow projects. Reusable
packages own runtime code; consuming projects own markup contracts, composition, content,
identifiers, and hosting choices.

## Boundaries

- Prefer Webflow-native layout, components, CMS, forms, variables, and base styling. Keep browser code focused on behavior attached to existing Webflow markup.
- Honor the user's animation approach first. Prefer GSAP addons for custom animation work; use CSS for simple state effects or native Webflow Interactions when they are clearly sufficient and Designer ownership is useful. Choosing GSAP does not require proving that native Interactions are incapable. Preserve existing animation ownership unless changing it is part of the request.
- Use neutral `data-wft-*` hooks. Never introduce client names, assets, URLs, site IDs, component IDs, credentials, copied production markup, or project fallback selectors.
- Keep package ESM imports side-effect-free. Each consumer-owned addon entry under `src/addons/` selects and initializes its own behavior and builds to an independent `dist/addons/<name>.js` with optional CSS. Project entries are optional and compose only deliberately selected behavior.
- Make lifecycle initialization idempotent and destruction complete. Preserve DOM, attributes, accessibility state, and remote data that the code does not own.
- Treat inspection, planning, recovery preparation, write confirmation, application, read-back, verification, and publishing as separate phases. Webflow writes and publishing require an explicit user request and the matching MCP skill.
- Before any non-publication Webflow-hosted mutation, inspect current state and present the exact bounded plan, affected identifiers, blast radius, preserved state, and recovery limits. Then ask the user to create a new native Webflow restore point after all current changes are saved, or to explicitly waive it after those limits are explained. Stop for a new reply confirming completion or waiver; an earlier or automatic backup, activity history, visual snapshot, or advance approval does not satisfy this checkpoint.
- Only after that new reply, re-check that the plan and target state are unchanged and ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot also confirm the write. Restart the gate if the plan or target state changes; one completed gate may cover only its unchanged bounded batch.
- For CMS creates or edits, offer the optional agent-tracking fields, write them only after explicit opt-in, and allow refusal; never create tracking schema silently. Before creating an item on a localized site, explicitly confirm the locale set, recommend all configured locales, and stop rather than silently fall back to primary-only when the tool cannot express that scope.
- Keep hosting and deployment integrations optional; reusable browser packages must not assume a provider or target.

Use the official Webflow MCP server and pinned official Webflow skills for broad Designer, CMS,
custom-code, audit, and publishing workflows. Load the smallest matching generated skill before
specialized work.
