---
name: build-webflow-slider
description: Design, implement, and test responsive Webflow sliders with the optional Slice Media Swiper Adapter and neutral markup. Use for carousels, CMS lists, breakpoint conversion, or reusable slider foundations.
metadata:
  surfaces: [local-agent]
---

# Build Webflow Slider

Prefer upstream Swiper for sliders and carousels, using the optional Slice Media Swiper Adapter for its lifecycle, responsive, and CMS support. Honor an explicit user choice of native Webflow sliders or another implementation. Choosing Swiper does not require proving native sliders inadequate. Preserve existing slider ownership unless migration is requested, and keep source content readable before enhancement and after teardown.

## Workflow

1. Follow the user's chosen slider implementation; otherwise choose Swiper. For Swiper, select always-on or breakpoint-enabled behavior and identify the existing owner before changing it.
2. Prefer existing Webflow elements, project design classes, and addon-specific root/track/slide/control attributes such as `data-wft-gallery-slider-*`. Follow [the namespace contract](references/slider-contract.md#attribute-namespaces): retain the adapter's shared `data-wft-slider` boundary marker, activate only the owning addon's roots, and map its names through `structure` options. Verify the installed adapter API first; 0.2.0 adds structure adaptation and 0.1.x lacks it. Honor an explicit standard-markup choice and preserve existing ownership. Keep controls inside the component root and import only the official Swiper CSS entries the selected modules need, in a lower-priority `swiper` cascade layer so Webflow design classes keep control.
3. Keep Swiper and `@slicemedia/swiper-adapter` in one project-owned shared vendor entry under `src/vendors/`, declared in `devkit.config.json`. Load that vendor JS and CSS once, only after matching markup needs it; await the generated `createProjectSlider()` integration. Add the opt-in `/webflow` helper and only its required CSS to that same vendor when using scoped A11y, Navigation, or Pagination. Do not statically import another adapter/vendor copy into each addon or add sliders to an unrelated starter.
4. For a CMS list that can reorder or replace nodes, give every slide a persistent key unique within its track, using an addon-specific attribute configured through `slideKeyAttribute`, and enable mutation observation. Preserve the documented shared `data-wft-slide-key` in existing contracts. Do not derive identity from the current array index.
5. Preserve project-owned markup and attributes. Let the controller own one vendor instance per root and destroy it before another controller takes ownership.
6. Define typed breakpoint, sizing, motion, navigation, pagination, and refresh options. Treat reduced motion and any missing `ResizeObserver` fallback as project decisions rather than implied package behavior.
7. Test repeated roots and two different slider addons together, nested control scope before either controller initializes, root/container ownership conflicts, grid-to-slider breakpoint crossings and restoration, keyed CMS insertion/replacement, initially hidden containers, native-button keyboard behavior, resize, destroy, and reinitialize on the real rendered project. Inspect `structureIssue` when markup is missing, empty, or incompatible.
8. Return an editor-facing handoff that identifies which slider structure, attributes, CMS bindings, project integration, and options control the behavior; list affected instances, verified breakpoints, remaining checks, and publication state.

Read [the slider contract](references/slider-contract.md) before planning or implementing an
adapter-backed slider, including attribute naming, CMS mutation, loop mode, hidden containers,
scoped controls, and shared behavior.
