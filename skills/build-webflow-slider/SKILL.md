---
name: build-webflow-slider
description: Design, implement, and test responsive Webflow sliders with the optional Slice Media Swiper Adapter and neutral markup. Use for carousels, CMS lists, breakpoint conversion, or reusable slider foundations.
---

# Build Webflow Slider

Use the optional Slice Media Swiper Adapter around upstream Swiper when native Webflow or a simpler maintained integration cannot meet the requirement. It is not a fork. Preserve readable source content before enhancement and after teardown.

## Workflow

1. Confirm that native Webflow behavior cannot meet the requirement, then choose always-on or breakpoint-enabled behavior.
2. Use standard `.swiper`, `.swiper-wrapper`, and `.swiper-slide` structure plus one scoped `[data-wft-slider]` root. Keep controls inside that root and import only the official Swiper CSS entries the selected modules need.
3. Import `@slicemedia/swiper-adapter` only in the selected project integration. Use its opt-in `/webflow` entry when the slider needs scoped upstream A11y, Navigation, or Pagination modules; never add either entry to an unrelated starter.
4. For a CMS list that can reorder or replace nodes, give every slide a unique persistent `data-wft-slide-key` and enable mutation observation. Do not derive identity from the current array index.
5. Preserve project-owned markup and attributes. Let the controller own one vendor instance per root and destroy it before another controller takes ownership.
6. Define typed breakpoint, sizing, motion, navigation, pagination, and refresh options. Treat reduced motion and any missing `ResizeObserver` fallback as project decisions rather than implied package behavior.
7. Test multiple roots, ownership conflicts, breakpoint crossings, keyed CMS insertion/removal, initially hidden containers, native-button keyboard behavior, resize, destroy, and reinitialize on the real rendered project.
8. Return an editor-facing handoff that identifies which slider structure, attributes, CMS bindings, project integration, and options control the behavior; list affected instances, verified breakpoints, remaining checks, and publication state.

Read [the slider contract](references/slider-contract.md) before planning or implementing any
adapter-backed slider involving CMS mutation, loop mode, hidden containers, scoped controls, or
shared behavior.
