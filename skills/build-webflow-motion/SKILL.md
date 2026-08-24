---
name: build-webflow-motion
description: Choose, design, implement, or review accessible Webflow motion using CSS, native Webflow Interactions, or project-owned GSAP. Use when motion ownership, responsive behavior, lifecycle cleanup, or scroll geometry needs an explicit plan.
metadata:
  surfaces: [local-agent]
---

# Build Webflow Motion

Webflow MCP version: 2.0.1.

Give one behavior one motion owner. Start from a complete, readable, operable state without animation, then add the least complex layer that meets the requirement.

## Choose the motion layer

- Use CSS transitions or keyframes for simple state-driven effects with no orchestration or runtime geometry.
- Use native Webflow Interactions when designers must maintain trigger/target/timeline behavior visually and the current Interactions controls express the requirement.
- Use project-owned GSAP when behavior depends on programmatic sequencing, runtime-inserted or mutated CMS content, runtime measurements, lifecycle APIs, or custom ScrollTrigger coordination. Server-rendered repeated CMS items can still use native Interactions when its trigger and scope controls are sufficient.

Do not combine layers on the same property or trigger without documenting ownership and conflict resolution.

## Workflow

1. Define the trigger, target scope, initial and final states, timing, interruption behavior, responsive conditions, reduced-motion result, and the meaningful content state when motion is absent.
2. Inspect existing styles, Interactions, project code, component scope, CMS repetition, and `data-wft-*` hooks. Identify competing transforms, opacity, visibility, scroll, or resize owners.
3. Select the layer with the decision guide. State why the simpler layer is insufficient before choosing GSAP.
4. Plan idempotent setup and complete teardown. For GSAP, scope selectors to each instance, collect animations and ScrollTriggers in a context or match-media lifecycle, and remove non-GSAP listeners, observers, timers, wrappers, inline state, and accessibility changes on destroy.
5. Reconcile breakpoint and `prefers-reduced-motion` changes by reverting the previous state before applying the next. Reduced motion must provide a usable stable state, not merely a faster version of unsafe motion.
6. Refresh measured scroll geometry only after layout-affecting fonts, media, CMS insertions, tabs, sliders, or accordions settle. Coalesce refreshes and avoid observer-refresh loops.
7. Require confirmation before any Webflow write. Before a shared-class, component, variable, interaction, bulk, or otherwise high-blast write, require a confirmed manual Webflow restore point or an explicit recorded waiver; snapshots and read-back are not backups.
8. Apply only the bounded approved change, read back Webflow-owned state, and test initialization, interruption, resize, preference changes, refresh, destroy, and reinitialize. Report owner, affected properties, accessibility behavior, restore-point status, evidence, and manual work.

Read [the motion decision guide](references/motion-decision-guide.md) before mixing scroll-driven motion, responsive variants, or component/CMS scopes.

## MCP and manual boundary

Current Webflow MCP cannot create or apply Webflow Interactions. It can inspect or change supporting elements, styles, attributes, components, and custom code, but native Interaction authoring remains a confirmed manual Designer step. The Designer bridge supplies live canvas context and snapshots; it does not remove that limitation. Never imply that a native Interaction plan was applied through MCP.

## Editor-facing handoff

Name the owning instance, component, CMS template/collection, page, or site and the exact control surface: Webflow style, native Interaction, or local GSAP/CSS module. Explain where future edits belong, which reused instances, breakpoints, properties, and scripts are also affected, and the verification, publication, restore-point, or waiver state.

Stop on ambiguous ownership, missing reduced-motion behavior, conflicting transforms, unresolved shared scope, a high-blast write without a restore point or waiver, stale layout measurements, or unavailable manual capability.
