# Webflow project guidance

This project uses an AI-first browser-development setup around Webflow. Webflow owns editable
structure and content; `src/main.ts` owns the project's explicit browser composition. Optional
integration modules must not run until deliberately imported.

## Boundaries

- Prefer native Webflow layout, components, CMS, forms, variables, and interactions before JavaScript.
- Add behavior through explicit, scoped `data-wft-*` hooks. Do not rely on generated class names or guessed selectors.
- Keep site IDs, domains, tokens, and deployment credentials in ignored environment files. Do not put secrets or project identifiers into reusable packages, fixtures, or AI instructions.
- Inspect before changing Webflow. Before any non-publication Webflow-hosted mutation, present the exact bounded plan, affected identifiers, blast radius, preserved state, and recovery limits. Ask the user to create a new native Webflow restore point after all current changes are saved, or to explicitly waive it after those limits are explained, then stop for a new reply confirming completion or waiver. Existing or automatic backups, activity history, snapshots, and advance approvals do not count.
- After that reply, re-check that the target state and plan are unchanged and ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot double as write confirmation. Restart the gate when the plan or state changes; one completed gate may cover only its unchanged bounded batch. Read back and verify every mutation.
- For CMS creates or edits, offer the optional agent-tracking fields, write them only after explicit opt-in, and allow refusal; never create tracking schema silently. Before creating an item on a localized site, explicitly confirm the locale set, recommend all configured locales, and stop rather than silently fall back to primary-only when the tool cannot express that scope.
- Keep integration modules side-effect-free and initialize them only from `src/main.ts`. Preserve unrelated DOM and remote state.
- Use synthetic local fixtures. Never copy production content into reusable examples.
- End completed or reviewable work with an editor-facing handoff: exact scope, control surface for future edits, affected consumers, changed/preserved/unverified state, validation, publication state, and recovery limitations.

## Common commands

- `pnpm dev` — run the project's local development server.
- `pnpm build` — build the project-owned browser bundle.
- `pnpm typecheck` — validate project code.

Load the smallest matching generated skill for enhancement authoring, inspection, Designer edits,
CMS work, attributes, debugging, accessibility, sliders, forms, staging verification, or
publication. Treat editing and publishing as separate requests; confirming an edit never authorizes
publication.
