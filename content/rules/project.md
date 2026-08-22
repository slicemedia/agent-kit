# Webflow project guidance

This project uses an AI-first browser-development setup around Webflow. Webflow owns editable
structure and content; `src/main.ts` owns the project's explicit browser composition. Optional
integration modules must not run until deliberately imported.

## Boundaries

- Prefer native Webflow layout, components, CMS, forms, variables, and interactions before JavaScript.
- Add behavior through explicit, scoped `data-wft-*` hooks. Do not rely on generated class names or guessed selectors.
- Keep site IDs, domains, tokens, and deployment credentials in ignored environment files. Do not put secrets or project identifiers into reusable packages, fixtures, or AI instructions.
- Inspect before changing Webflow. Any Designer, CMS, custom-code, delete, or publish operation requires an explicit request, a reviewed plan, read-back, and verification through the official Webflow MCP workflow.
- Before high-blast structure, deletion, shared design-system, schema, or bulk changes, require a confirmed manual Webflow restore point or an explicit recorded waiver. Treat snapshots as evidence only.
- Keep integration modules side-effect-free and initialize them only from `src/main.ts`. Preserve unrelated DOM and remote state.
- Use synthetic local fixtures. Never copy production content into reusable examples.
- End completed or reviewable work with an editor-facing handoff: exact scope, control surface for future edits, affected consumers, changed/preserved/unverified state, validation, publication state, and recovery limitations.

## Common commands

- `pnpm dev` — run the project's local development server.
- `pnpm build` — build the project-owned browser bundle.
- `pnpm typecheck` — validate project code.

Load the smallest matching generated skill for enhancement authoring, inspection, Designer edits,
CMS work, attributes, debugging, accessibility, sliders, forms, staging verification, or
publication. Treat editing and publishing as separate requests.
