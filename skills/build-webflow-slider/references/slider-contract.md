# Slider contract

## Product boundary

- Swiper is the default for new slider requests. The user's explicit native Webflow or other slider choice takes precedence.
- Share one loaded adapter and upstream Swiper module per project vendor URL so controllers across addon files use the same ownership registry. Initialize near the viewport when useful and await vendor CSS before measuring.

- Source markup remains useful without JavaScript. Prefer attribute hooks and component-specific Webflow design classes. The adapter temporarily applies upstream structural classes; official Swiper CSS still provides its base mechanics.
- `@slicemedia/swiper-adapter` supplies lifecycle, responsive reconciliation, and DOM restoration. It does not import CSS, generate controls, publish scripts, or replace project composition.
- `@slicemedia/swiper-adapter/webflow` is an opt-in options helper for upstream A11y, Navigation, and Pagination modules. It creates no markup and performs no initialization.

## Markup and ownership

- With adapter 0.2.0 or later, prefer `structure: true` with `[data-wft-slider]` on the component, `[data-wft-slider-track]` on its list, and `[data-wft-slider-slide]` on each direct item. If no items are marked, direct HTML children are slides, excluding scripts/styles/templates. Keep controls and other non-slide content outside the track.
- The track's existing parent becomes the Swiper container. `[data-wft-slider-container]` or `structure.container` can select it explicitly, but it must still be the track's direct parent inside the component. CMS Collection List Wrapper / Collection List / Collection Item maps naturally to container / track / slide. Mark the item itself, not a nested card; the adapter does not rebuild or reparent arbitrary DOM.
- Keep visual styling on Webflow component classes. Temporary `.swiper`, `.swiper-wrapper`, and `.swiper-slide` classes are runtime mechanics, not Designer class requirements. Customize scoped `structure.track`, `structure.slides`, and `structure.container` selectors when existing neutral hooks differ. Do not rename or fork upstream classes/CSS to accomplish this.
- Default preparation changes the track to non-wrapping flex in Swiper's direction, prevents slide growth/shrink, and clears gaps for Swiper's `spaceBetween`. Optional `equalHeight` stretches slides; optional `containInlineSize` suits a container constrained by a grid/flex parent. Keep `slidesPerView: "auto"` card widths in Webflow. `layout: false` leaves layout mechanics to project CSS; `clearGap: false` requires verified spacing.
- Standard authored Swiper markup remains supported when `structure` is omitted/false. Respect a user's explicit choice and existing sliders. Verify installed declarations and release availability before using the new mode: 0.1.x lacks it, and DevKit 0.5.0's generated `^0.1.0` dependency range does not include 0.2.0. Upgrade deliberately when adopting it; do not pass a nonexistent option or promise an unpublished release.
- Never combine attribute structure with upstream `createElements`, virtual slides, or renamed wrapper/slide classes. Multi-row Swiper Grid requires `layout: false` and compatible project CSS.
- The loaded adapter module coordinates its controllers so only one owns a component root and its resolved container. It also declines either element with a standard active external Swiper instance and emits `ownershipConflict`.
- This is not a universal lock across arbitrary separately bundled custom factories. Avoid loading duplicate adapter bundles and verify the rendered script inventory when duplicate behavior remains possible.
- Breakpoint disable/destroy restores authored attributes, layout, and list roles. Swiper can reorder slides for loop mode, but the adapter does not clone CMS content.
- Missing or empty tracks defer initialization; invalid nesting or ambiguous tracks emit `structureIssue` with an element, reason, and message. Fix the declared contract rather than silently falling back to unrelated selectors. Mutation observation retries child changes; call `refresh()` explicitly after attribute-only contract changes.

## CMS identity

- Set a unique, persistent `data-wft-slide-key` on every CMS slide when items can be inserted, sorted, filtered, or replaced. Enable `observeMutations` or call `refresh()` after the integration's own completion event.
- Newly inserted slides are prepared before update; replacing the entire track recreates its instance. Refresh preserves the active element when it survives. If nodes are replaced, it matches the unique key. In loop mode the adapter passes a matched slide's upstream `data-swiper-slide-index` to `slideToLoop()` as the real logical index. A fresh unindexed replacement is restored with its current refreshed active index instead; never pass a rearranged array index to `slideToLoop()` and call it logical identity.
- If the active item was removed or no stable key exists, the adapter clamps the prior logical index. Do not claim that it can preserve an item whose identity disappeared.

## Hidden layout

- Measurable-root deferral is enabled by default. Both the component root and actual Swiper container must be measurable; a visible heading does not make a hidden CMS list ready.
- The adapter observes target sizes when `ResizeObserver` exists. When it does not, or when another library changes layout without a delivered resize, call `refresh()` after the tab, modal, filter, font, or image transition completes.
- Use `deferUntilMeasurable: false` only when hidden-geometry initialization is deliberate and tested.

## Accessible controls

- Put `[data-wft-slider-prev]`, `[data-wft-slider-next]`, and optional `[data-wft-slider-pagination]` inside their component root, outside the track. They can be siblings of the CMS wrapper. Nested slider controls belong only to the nested root. Pass the component root to `createWebflowSwiperOptions()`, even when Swiper uses an inner container.
- Navigation controls must be native `<button type="button">` elements. Give them visible text, `aria-label`, a valid `aria-labelledby`, or pass localized `previousLabel` and `nextLabel` values to `createWebflowSwiperOptions()`.
- Import `swiper/css` plus the official CSS entries for the enabled A11y, Navigation, and Pagination modules through a project stylesheet using `@import "swiper/css" layer(swiper);` (likewise for module CSS). Keep that layer below project styles so lazy-loaded vendor CSS does not override Webflow card display or widths; if project styles also use layers, declare their order explicitly. The helper scopes elements and passes localized messages to upstream Swiper; upstream owns disabled state and carousel announcements while initialized. Attribute preparation temporarily suspends conflicting CMS list roles when A11y uses carousel groups, then restores them on teardown.
- If a project bypasses the `/webflow` helper or supplies a custom factory, that project owns module registration, accessible names, disabled state, and keyboard verification.

## Verification

- Test no-JavaScript reading order, multiple roots, one-root ownership conflicts, keyed CMS insertion and removal, breakpoint disable/re-enable, hidden-to-visible activation, navigation by keyboard, reduced motion, resize, and complete destroy/reinitialize.
- Destroy must restore project-authored attributes and accessibility state while preserving CMS nodes added after initialization.

## DevKit integration

Pass the mode through the generated async integration after checking the installed adapter version:

```ts
const slider = await createProjectSlider({
  target: root,
  structure: true,
  enabled: { maxWidth: 767 },
  observeMutations: true,
  swiper: { slidesPerView: 1.2, spaceBetween: 16 },
});
slider?.on("structureIssue", ({ reason, message, element }) => {
  console.warn(reason, message, element);
});
slider?.init();
// On addon teardown: slider?.destroy();
```

Import `createProjectSlider` from the project's integration. Keep runtime adapter imports and optional `/webflow` helpers in the shared slider vendor, not in each addon. If exposing the controls helper from that vendor, update the integration's declared shared exports together with it. Rebuild and deploy the complete `dist/` tree after changing the dependency or vendor contract.
