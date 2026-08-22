# Slider contract

## Product boundary

- Source markup remains useful without JavaScript. Structural classes and CSS come from upstream Swiper.
- `@slicemedia/swiper-adapter` supplies lifecycle, responsive reconciliation, and DOM restoration. It does not import CSS, generate controls, publish scripts, or replace project composition.
- `@slicemedia/swiper-adapter/webflow` is an opt-in options helper for upstream A11y, Navigation, and Pagination modules. It creates no markup and performs no initialization.

## Markup and ownership

- Scope each instance with `[data-wft-slider]`, then use standard `.swiper`, `.swiper-wrapper`, and `.swiper-slide` classes.
- The loaded adapter module coordinates its controllers so only one owns a root. It also declines a root with a standard active external Swiper instance and emits `ownershipConflict`.
- This is not a universal lock across arbitrary separately bundled custom factories. Avoid loading duplicate adapter bundles and verify the rendered script inventory when duplicate behavior remains possible.
- Breakpoint changes destroy and recreate only the owned instance. They do not clone CMS content.

## CMS identity

- Set a unique, persistent `data-wft-slide-key` on every CMS slide when items can be inserted, sorted, filtered, or replaced. Enable `observeMutations` or call `refresh()` after the integration's own completion event.
- Refresh preserves the active element when it survives. If nodes are replaced, it matches the unique key. In loop mode the adapter passes a matched slide's upstream `data-swiper-slide-index` to `slideToLoop()` as the real logical index. A fresh unindexed replacement is restored with its current refreshed active index instead; never pass a rearranged array index to `slideToLoop()` and call it logical identity.
- If the active item was removed or no stable key exists, the adapter clamps the prior logical index. Do not claim that it can preserve an item whose identity disappeared.

## Hidden layout

- Measurable-root deferral is enabled by default. A zero-width or hidden root is not initialized or updated until it becomes measurable.
- The adapter observes target sizes when `ResizeObserver` exists. When it does not, or when another library changes layout without a delivered resize, call `refresh()` after the tab, modal, filter, font, or image transition completes.
- Use `deferUntilMeasurable: false` only when hidden-geometry initialization is deliberate and tested.

## Accessible controls

- Put `[data-wft-slider-prev]`, `[data-wft-slider-next]`, and optional `[data-wft-slider-pagination]` inside their slider root.
- Navigation controls must be native `<button type="button">` elements. Give them visible text, `aria-label`, a valid `aria-labelledby`, or pass localized `previousLabel` and `nextLabel` values to `createWebflowSwiperOptions()`.
- Import `swiper/css` plus the official CSS entries for the enabled A11y, Navigation, and Pagination modules. The helper scopes elements and passes localized messages to upstream Swiper; upstream owns disabled state and carousel announcements while initialized.
- If a project bypasses the `/webflow` helper or supplies a custom factory, that project owns module registration, accessible names, disabled state, and keyboard verification.

## Verification

- Test no-JavaScript reading order, multiple roots, one-root ownership conflicts, keyed CMS insertion and removal, breakpoint disable/re-enable, hidden-to-visible activation, navigation by keyboard, reduced motion, resize, and complete destroy/reinitialize.
- Destroy must restore project-authored attributes and accessibility state while preserving CMS nodes added after initialization.
