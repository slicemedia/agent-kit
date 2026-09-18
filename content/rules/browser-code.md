# Browser enhancement rules

- Expose reusable behavior through typed addon metadata and lifecycle methods; keep ESM imports inert.
- For DevKit versions with the inspection API, declare nested markup roles, conditions, counts, and value constraints in the shared definition consumed by DevTools, `explain`, and `catalog`. Use `context.resolveOptions(root)` for per-instance configuration, synchronous read-only `inspect` reports for runtime facts, and `initializeAddon(runtime, instance)` in the browser entry so failed startup remains inspectable. Keep unavailable diagnostics unverified.
- Scope queries to an explicit root, support multiple instances, and use only documented `data-wft-*` hooks.
- Track and remove owned listeners, observers, timers, generated nodes, attributes, styles, and vendor instances.
- Reconcile missing or delayed DOM, CMS mutations, breakpoint changes, reduced motion, keyboard use, and destroy/reinitialize cycles when relevant.
- Prefer GSAP addons for custom animation requests, honoring the user's chosen approach first. Keep markup and base styling in Webflow, and let the animation addon own timelines, scroll coordination, responsive state, and cleanup. Simple CSS effects and straightforward Designer-owned Interactions remain suitable alternatives.
- Prefer Swiper for sliders and carousels, using the optional Slice Media Swiper Adapter where its lifecycle and CMS support fit. Honor an explicit user choice of native Webflow sliders or another implementation. Do not require native sliders to fail first, and preserve existing slider ownership unless migration is requested.
- Use upstream library APIs and CSS rather than private forks or renamed structural classes.
- Keep third-party libraries optional and shared. Independent addon scripts load project-owned vendor JS/CSS on demand through DevKit's page-level loader. Put vendor imports in declared `src/vendors/` entries, emitted once under `dist/vendor/`; check markup and optionally proximity before loading. A dynamic import in a standalone IIFE alone does not create a shared file. Optional project entries may combine selected behavior; never require a universal addon bundle.
- Keep examples neutral, copyable, and explicitly imported; examples must never run from a package root import.
