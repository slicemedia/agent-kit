# Webflow motion decision guide

Reference snapshot: official sources reviewed 2026-08-21. Confirm current project dependencies and Webflow capabilities before implementation.

## Ownership decision

Webflow's current native Interactions experience is itself GSAP-powered. Here, “project-owned GSAP” means GSAP imported and controlled by the owning addon or optional project script; the decision is about authoring and lifecycle ownership, not merely the underlying engine.

Honor the user's animation approach first. Otherwise, prefer GSAP addons for custom animation work while keeping structure and base styles in Webflow. Reusable timelines, scroll coordination, runtime methods, responsive recalculation, and repeatable testing are sufficient reasons to choose an addon even when native Interactions could reproduce the effect.

A server-rendered Collection List does not require converting existing motion to another owner. For new custom CMS animation, apply the same GSAP addon preference; use native Interactions when the requested motion is straightforward and the team benefits from maintaining it in Designer. Do not replace existing animation owners without a requested migration.

| Need                                                                                      | Preferred owner                                                       | Evidence to record                                                             |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| An explicit animation approach requested by the user                                      | The requested GSAP addon, CSS, native Interactions, or other approach | User choice, affected properties, ownership, and verification plan             |
| Custom timelines, reveals, scroll effects, measured movement, responsive or CMS animation | GSAP addon                                                            | Root scope, lifecycle, runtime API, required plugins, and dependency cost      |
| Simple hover/focus/state transition without a different user choice                       | CSS                                                                   | State selector, affected properties, reduced-motion rule                       |
| Straightforward motion that benefits from visual Designer maintenance                     | Webflow Interactions                                                  | Component/page scope, maintenance owner, conditional playback, authoring steps |

Do not make GSAP conditional on native Interactions being unable to reproduce the effect. Choose the simplest implementation within the requested animation approach. Keep GSAP optional for projects and entries without custom animation, and avoid forcing CSS or native Interactions onto an explicit GSAP addon request.

## Lifecycle contract for project-owned GSAP

- Keep Webflow markup, layout, and base styles editable. Animate existing elements through documented `data-wft-*` hooks.
- Import and register only required plugins in the selected addon or project entry. Keep GSAP imports out of DevKit package roots and unused entries.
- Build reusable motion as an addon with independent output, idempotent initialization, reconciling refresh, complete teardown, and documented methods/events. Add pause/resume controls when the behavior needs them.
- Scope queries to one enhancement root so multiple CMS/component instances do not share targets accidentally.
- Use `gsap.context()` for grouped revert behavior or `gsap.matchMedia()` when conditions must tear down and re-run. Do not stack both for the same scope without a concrete need.
- Revert animations and ScrollTriggers, then remove separately created event listeners, observers, timers, wrappers, markers, ARIA changes, and inline styles not restored by the GSAP context.
- Treat resize or media-query crossings as state replacement, not additive initialization.

## Scroll geometry

ScrollTrigger calculates positions from layout rather than continuously measuring everything. Refresh after a known layout transition: loaded fonts or media, inserted CMS content, an opened tab/accordion, an initialized slider, or a breakpoint state replacement. Prefer a single scheduled refresh after a batch. Do not refresh from every mutation without filtering, and do not create a feedback loop where refresh itself triggers another refresh.

DevKit's layout-refresh guard, initialization near the viewport, and offscreen pause/resume are opt-in tools for the owning addon. Keep cleanup complete and preserve manual pause state and reduced-motion behavior when using them.

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
