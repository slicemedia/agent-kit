---
name: build-webflow-motion
description: Design, implement, or review accessible Webflow animation, preferring GSAP addons for custom motion while honoring explicit user choices. Use for timelines, reveals, scroll effects, responsive behavior, lifecycle cleanup, or choosing suitable CSS and native Interaction alternatives.
metadata:
  surfaces: [local-agent]
---

# Build Webflow Motion

Webflow MCP version: 2.0.1.

Give one behavior one motion owner. Keep structure, content, and base styling in Webflow, with a complete, readable, operable state when motion is absent. Prefer GSAP addons for custom animation work.

## Choose the motion layer

- Honor an explicit user choice of GSAP, CSS, native Interactions, or another approach. An explicit GSAP addon request does not need justification against native Interactions.
- Otherwise, prefer GSAP addons for custom timelines, reveals, scroll-linked effects, measured movement, responsive recalculation, CMS animation, or motion that benefits from runtime APIs and repeatable testing. Native Interactions being able to reproduce an effect does not rule out a GSAP addon.
- Use CSS transitions or keyframes for simple state-driven effects with no orchestration or runtime geometry when the user has not chosen another approach.
- Use native Webflow Interactions when the motion is straightforward, clearly sufficient, and useful for the team to maintain visually in Designer, or when the user requests them.

Preserve existing animation owners unless the requested work includes changing them. Do not combine layers on the same property or trigger without documenting ownership and conflict resolution.

## Workflow

1. Define the trigger, target scope, initial and final states, timing, interruption behavior, responsive conditions, reduced-motion result, and the meaningful content state when motion is absent.
2. Inspect existing styles, Interactions, project code, component scope, CMS repetition, and `data-wft-*` hooks. Identify competing transforms, opacity, visibility, scroll, or resize owners.
3. Select the owner with the decision guide and the user's preference. Default custom animation work to a GSAP addon; explain any CSS or native Interaction choice in terms of the requested behavior and maintenance needs. Do not require proof that native Interactions are incapable before choosing GSAP.
4. For a GSAP addon, keep reusable modules inert and initialize from its own `src/addons/<name>.entry.ts`, optionally inside nested category folders. It builds independently at the corresponding path under `dist/addons/`, with `.entry` removed. Check the installed CLI's conventions in older projects. Load GSAP and selected plugins once from the project's shared animation vendor after matching markup needs them; await `loadProjectAnimations()` rather than statically bundling GSAP in every addon. Plan idempotent setup, reconciling refresh, and complete teardown. Scope selectors to each instance, collect animations and ScrollTriggers in a context or match-media lifecycle, and remove non-GSAP listeners, observers, timers, wrappers, inline state, and accessibility changes on destroy. Expose pause/resume controls when needed and register the initialized API with the shared runtime.
5. Reconcile breakpoint and `prefers-reduced-motion` changes by reverting the previous state before applying the next. Reduced motion must provide a usable stable state, not merely a faster version of unsafe motion.
6. Refresh measured scroll geometry only after layout-affecting fonts, media, CMS insertions, tabs, sliders, or accordions settle. Opt into DevKit's layout-refresh guard when needed, coalesce refreshes, and avoid observer-refresh loops. The optional guard includes window-load settling passes; inspect `getState()`/`onRefresh` reasons, successful/skipped/error counts, and pending passes when diagnosing offsets. Initialization near the viewport and offscreen pause/resume are opt-in choices that must respect manual pause state and reduced motion.
7. Before any Webflow-hosted mutation, present the exact bounded operations, target identifiers, blast radius, preserved state, and recovery limitations. Ask the user to save all current Webflow changes and create a new native Webflow restore point, or explicitly waive it after those limits are explained. Hard-stop for a new reply confirming completion or waiver. Existing, automatic, or historical backups, activity history, snapshots, read-back, and advance approvals do not count.
8. After that reply, re-read the affected state. Restart the gate if state or the plan changed. Otherwise ask for a separate final confirmation immediately before the first write. The restore-point or waiver reply cannot double as write confirmation; one gate covers only its unchanged bounded batch.
9. Apply only the bounded approved change, read back Webflow-owned state, and test initialization, interruption, resize, preference changes, refresh, destroy, and reinitialize. Report owner, affected properties, accessibility behavior, recovery checkpoint, final confirmation, evidence, and manual work. Editing never authorizes publishing.

Read [the motion decision guide](references/motion-decision-guide.md) before mixing scroll-driven motion, responsive variants, or component/CMS scopes.

## MCP and manual boundary

Current Webflow MCP cannot create or apply Webflow Interactions. It can inspect or change supporting elements, styles, attributes, components, and custom code, but native Interaction authoring remains a confirmed manual Designer step. The Designer bridge supplies live canvas context and snapshots; it does not remove that limitation. Never imply that a native Interaction plan was applied through MCP.

## Editor-facing handoff

Name the owning instance, component, CMS template/collection, page, or site and the exact control surface: Webflow style, native Interaction, or local GSAP/CSS module. For addons, include the standalone script and optional stylesheet, required plugins, markup hooks, options, and public lifecycle methods/events. Explain where future edits belong, which reused instances, breakpoints, properties, and scripts are also affected, and the verification, publication, restore-point, or waiver state.

Stop on ambiguous ownership, missing reduced-motion behavior, conflicting transforms, unresolved shared scope, a Webflow write without its recovery checkpoint and separate final confirmation, stale layout measurements, or unavailable manual capability.
