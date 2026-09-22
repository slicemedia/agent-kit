# Webflow project guidance

This project uses an AI-first browser-development setup around Webflow. Webflow owns editable
structure and content; consumer-owned browser entries initialize enhancements explicitly. Each
public addon under `src/addons/` builds to its own standalone script under `dist/addons/`.
Use `.entry.ts` / `.entry.js` for new browser entries; category folders may nest and are preserved
in output URLs with `.entry` removed. Legacy flat-file and one-folder `index.ts` conventions keep
their existing outputs. Check the installed CLI's supported conventions in older projects.
Project entries are optional and compose only deliberately selected behavior. Optional integration
modules must not run until deliberately imported by the entry that needs them.

## Boundaries

- Prefer Webflow-native layout, components, CMS, forms, variables, and base styling. Keep browser code focused on behavior attached to existing Webflow markup.
- Honor the user's animation approach first. Prefer GSAP addons for custom animation work; use CSS for simple state effects or native Webflow Interactions when they are clearly sufficient and Designer ownership is useful. Choosing GSAP does not require proving that native Interactions are incapable. Preserve existing animation ownership unless changing it is part of the request.
- Prefer Swiper for sliders and carousels, using the optional Slice Media Swiper Adapter where its lifecycle and CMS support fit. Honor an explicit user choice of native Webflow sliders or another implementation. Do not require native sliders to fail first, and preserve existing slider ownership unless migration is requested.
- For custom Swiper addons, prefer existing Webflow elements with neutral root/track/slide attributes and component-specific design classes. Use the adapter's opt-in attribute structure preparation when its installed version supports it; technical Swiper classes and layout belong to the temporary runtime enhancement. Honor explicit markup choices, keep official Swiper CSS, and restore the authored layout on teardown.
- Add behavior through explicit, scoped `data-wft-*` hooks. Do not rely on generated class names or guessed selectors.
- Keep site IDs, domains, tokens, and deployment credentials in ignored environment files. Do not put secrets or project identifiers into reusable packages, fixtures, or AI instructions.
- Inspect before changing Webflow. Before any non-publication Webflow-hosted mutation, present the exact bounded plan, affected identifiers, blast radius, preserved state, and recovery limits. Ask the user to create a new native Webflow restore point after all current changes are saved, or to explicitly waive it after those limits are explained, then stop for a new reply confirming completion or waiver. Existing or automatic backups, activity history, snapshots, and advance approvals do not count.
- After that reply, re-check that the target state and plan are unchanged and ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot double as write confirmation. Restart the gate when the plan or state changes; one completed gate may cover only its unchanged bounded batch. Read back and verify every mutation.
- For CMS creates or edits, offer the optional agent-tracking fields, write them only after explicit opt-in, and allow refusal; never create tracking schema silently. Before creating an item on a localized site, explicitly confirm the locale set, recommend all configured locales, and stop rather than silently fall back to primary-only when the tool cannot express that scope.
- Keep package and integration modules side-effect-free. Initialize each addon from its own browser entry; do not force all addons into `src/main.ts` or one universal bundle. Register its public API explicitly with the shared runtime and preserve unrelated DOM and remote state.
- Use synthetic local fixtures. Never copy production content into reusable examples.
- End completed or reviewable work with an editor-facing handoff: exact scope, control surface for future edits, affected consumers, changed/preserved/unverified state, validation, publication state, and recovery limitations.

## DevTools for addon debugging

When investigating addon behavior, missing attributes, configuration, or duplicate scripts,
proactively suggest the optional on-page DevTools inspector and explain which evidence it provides.
Continue with console, network, and DOM inspection if it is unavailable or the user declines.

Check for `window.DevKitDevTools`. DevKit's **On-page DevTools inspector** setup choice installs
the optional `@slicemedia/devtools` package and creates
`src/addons/devtools.ts`, which builds to `dist/addons/devtools.js`; the entry or hosted script still
needs to be loaded on the page. It can be added later by installing `@slicemedia/devtools`, importing
`createDevTools` from it, and calling `init()`. Check compatibility with the installed DevKit version;
the inspector is optional, not a prerequisite for debugging.

The loaded inspector activates automatically on `webflow.io` unless explicitly disabled. On
localhost and custom domains, use the console:

```js
window.DevKitDevTools.enabled = true;
window.DevKitDevTools.open();
```

Review addon versions, the nested requirements tree, per-instance options, runtime/dependency
reports, and duplicate warnings. Use **Rescan** or `window.DevKitDevTools.refresh()` after markup,
CMS, options, viewport, or lifecycle changes; this does not call addon lifecycle methods or fix
attributes. Disable it with `window.DevKitDevTools.enabled = false`; explicit activation choices
are remembered per origin.

Findings cover declared contracts and available runtime reports. Unregistered code cannot be
discovered reliably, unclaimed hooks are informational, and unavailable diagnostics remain
unverified. A clean scan or `ready` lifecycle does not prove behavior works. Reproduce the actual
interaction and use the debugging skill for evidence and verification.

## Common commands

- `pnpm dev` — run the project's local development server.
- `pnpm build` — build separate public addon scripts and optional project scripts.
- `pnpm typecheck` — validate project code.

Load the smallest matching generated skill for enhancement authoring, inspection, Designer edits,
CMS work, attributes, debugging, accessibility, sliders, forms, staging verification, or
publication. Treat editing and publishing as separate requests; confirming an edit never authorizes
publication.
