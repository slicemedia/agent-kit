# Webflow motion decision guide

Reference snapshot: official sources reviewed 2026-08-21. Confirm current project dependencies and Webflow capabilities before implementation.

## Ownership decision

Webflow's current native Interactions experience is itself GSAP-powered. Here, “project-owned GSAP” means GSAP imported and controlled by the site's local bundle; the decision is about authoring and lifecycle ownership, not merely the underlying engine.

A server-rendered Collection List does not by itself require project code. Native Interactions remain a candidate when their scroll trigger and class, attribute, or component scoping cover every repeated item; choose project-owned GSAP for runtime insertion/mutation, custom measurement, or sequencing that native controls cannot express.

| Need                                                                              | Preferred owner         | Evidence to record                                                  |
| --------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| Hover/focus/state transition or small autonomous decoration                       | CSS                     | State selector, affected properties, reduced-motion rule            |
| Designer-maintained triggers, component-scoped timeline, or visual authoring      | Webflow Interactions    | Component/page scope, conditional playback, manual authoring steps  |
| Dynamic sequencing, runtime geometry, CMS mutation, or custom scroll coordination | GSAP in the site bundle | Why native controls are insufficient, lifecycle and dependency cost |

CSS is not automatically simpler when it requires duplicated markup states or brittle selectors. Native Interactions are not automatically preferable when the required operation cannot be maintained or verified in the Designer. GSAP is not a default merely because it is available.

## Lifecycle contract for project-owned GSAP

- Import and register only required plugins in the selected project integration.
- Scope queries to one enhancement root so multiple CMS/component instances do not share targets accidentally.
- Use `gsap.context()` for grouped revert behavior or `gsap.matchMedia()` when conditions must tear down and re-run. Do not stack both for the same scope without a concrete need.
- Revert animations and ScrollTriggers, then remove separately created event listeners, observers, timers, wrappers, markers, ARIA changes, and inline styles not restored by the GSAP context.
- Treat resize or media-query crossings as state replacement, not additive initialization.

## Scroll geometry

ScrollTrigger calculates positions from layout rather than continuously measuring everything. Refresh after a known layout transition: loaded fonts or media, inserted CMS content, an opened tab/accordion, an initialized slider, or a breakpoint state replacement. Prefer a single scheduled refresh after a batch. Do not refresh from every mutation without filtering, and do not create a feedback loop where refresh itself triggers another refresh.

## Accessibility and verification

- The base document must expose all meaningful content and controls without motion.
- Respect `prefers-reduced-motion`; choose no animation or a safe end state according to the interaction's meaning.
- Avoid rapid flashes, unexpected large-scale movement, keyboard traps, and focus movement caused only by visual transforms.
- Test initial load, repeated triggers, interruption, rapid input, scroll restoration, every supported breakpoint, preference changes, CMS insertion, destroy, and reinitialize.

## Official sources

- [Webflow Interactions with GSAP](https://help.webflow.com/hc/en-us/articles/42832301823635-Intro-to-Interactions-with-GSAP)
- [Webflow MCP capabilities and current Interactions limitation](https://developers.webflow.com/mcp/reference/overview)
- [GSAP `gsap.context()` cleanup](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/)
- [GSAP `gsap.matchMedia()` responsive lifecycle](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
