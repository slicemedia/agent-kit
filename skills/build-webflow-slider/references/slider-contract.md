# Slider contract

## Product boundary

- Swiper is the default for new slider requests. The user's explicit native Webflow or other slider choice takes precedence.
- Share one loaded adapter and upstream Swiper module per project vendor URL so controllers across addon files use the same ownership registry. Initialize near the viewport when useful and await vendor CSS before measuring.

- Source markup remains useful without JavaScript. Prefer attribute hooks and component-specific Webflow design classes. The adapter temporarily applies upstream structural classes; official Swiper CSS still provides its base mechanics.
- `@slicemedia/swiper-adapter` supplies lifecycle, responsive reconciliation, and DOM restoration. It does not import CSS, generate controls, publish scripts, or replace project composition.
- `@slicemedia/swiper-adapter/webflow` is an opt-in options helper for upstream A11y, Navigation, and Pagination modules. It creates no markup and performs no initialization.

## Attribute namespaces

For a new slider addon, use its own namespace for activation, roles, controls, options, and item
keys; follow the [addon namespace contract](../../author-webflow-addon/references/addon-contract.md#attribute-namespaces-and-ownership).
For example, `gallery-slider` uses `data-wft-gallery-slider` and
`data-wft-gallery-slider-track`, while a separate `testimonial-slider` uses its own prefix.
Repeated galleries reuse the gallery names; per-root options express instance differences.

Keep `data-wft-slider` on each component root **alongside** its addon-specific root hook. In
Adapter 0.2.0, the structure resolver and `/webflow` controls helper use this shared marker to
exclude nested slider components, including before initialization. Custom `structure` selectors
do not replace that boundary marker. Document it as adapter-owned shared scope, not as a universal
activation selector for unrelated addons.

Activate only roots belonging to this addon and pass those elements or its exact selector as
`target`. The generated `createProjectSlider()` defaults to all `[data-wft-slider]` roots; do not
leave that default in separate slider addons. The adapter's ownership guard can reject a second
controller, but cannot tell whether the first controller selected the wrong addon's root.

Map owned track/slide/container names through `structure`, controls through the `/webflow`
helper's `navigation.previous`, `navigation.next`, and `pagination.element`, and CMS keys through
`slideKeyAttribute`. Preserve established generic hooks such as `data-wft-slider-track` and
`data-wft-slide-key` when they are an intentional documented shared contract; change names only
with coordinated runtime, metadata, and markup migration.

## Markup and ownership

- With adapter 0.2.0 or later, prefer an explicit `structure` mapping for addon-specific list and direct-item hooks. `structure: true` uses the shared defaults `[data-wft-slider-track]` and `[data-wft-slider-slide]`; if no items are marked, direct HTML children are slides, excluding scripts/styles/templates. Keep controls and other non-slide content outside the track.
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

- Set a persistent key unique within each track on every CMS slide when items can be inserted, sorted, filtered, or replaced. For new gallery contracts use `data-wft-gallery-slider-key` with `slideKeyAttribute` set to that name; the adapter defaults to `data-wft-slide-key` for existing shared contracts. Enable `observeMutations` or call `refresh()` after the integration's own completion event.
- Newly inserted slides are prepared before update; replacing the entire track recreates its instance. Refresh preserves the active element when it survives. If nodes are replaced, it matches the unique key. In loop mode the adapter passes a matched slide's upstream `data-swiper-slide-index` to `slideToLoop()` as the real logical index. A fresh unindexed replacement is restored with its current refreshed active index instead; never pass a rearranged array index to `slideToLoop()` and call it logical identity.
- If the active item was removed or no stable key exists, the adapter clamps the prior logical index. Do not claim that it can preserve an item whose identity disappeared.

## Hidden layout

- Measurable-root deferral is enabled by default. Both the component root and actual Swiper container must be measurable; a visible heading does not make a hidden CMS list ready.
- The adapter observes target sizes when `ResizeObserver` exists. When it does not, or when another library changes layout without a delivered resize, call `refresh()` after the tab, modal, filter, font, or image transition completes.
- Use `deferUntilMeasurable: false` only when hidden-geometry initialization is deliberate and tested.

## Accessible controls

- Put addon-specific previous/next hooks and optional pagination inside their component root, outside the track. They can be siblings of the CMS wrapper. Map them explicitly in `createWebflowSwiperOptions()`; its defaults remain `[data-wft-slider-prev]`, `[data-wft-slider-next]`, and `[data-wft-slider-pagination]` for shared contracts. Nested slider controls belong only to the nested root; retain the shared root boundary marker. Pass the component root to the helper, even when Swiper uses an inner container.
- Navigation controls must be native `<button type="button">` elements. Give them visible text, `aria-label`, a valid `aria-labelledby`, or pass localized `previousLabel` and `nextLabel` values to `createWebflowSwiperOptions()`.
- Import `swiper/css` plus the official CSS entries for the enabled A11y, Navigation, and Pagination modules through a project stylesheet using `@import "swiper/css" layer(swiper);` (likewise for module CSS). Keep that layer below project styles so lazy-loaded vendor CSS does not override Webflow card display or widths; if project styles also use layers, declare their order explicitly. The helper scopes elements and passes localized messages to upstream Swiper; upstream owns disabled state and carousel announcements while initialized. Attribute preparation temporarily suspends conflicting CMS list roles when A11y uses carousel groups, then restores them on teardown.
- If a project bypasses the `/webflow` helper or supplies a custom factory, that project owns module registration, accessible names, disabled state, and keyboard verification.

## Verification

- Test no-JavaScript reading order, repeated roots, two different slider addons together, nested roots and controls before initialization, one-root ownership conflicts, keyed CMS insertion and removal, breakpoint disable/re-enable, hidden-to-visible activation, navigation by keyboard, reduced motion, resize, and complete destroy/reinitialize. Confirm each addon selects only its own roots and settings.
- Destroy must restore project-authored attributes and accessibility state while preserving CMS nodes added after initialization.

## DevKit integration

Example contract for a new `gallery-slider` addon; visual classes remain Webflow-owned:

```html
<section data-wft-gallery-slider data-wft-slider>
  <div data-wft-gallery-slider-track>
    <article data-wft-gallery-slider-slide data-wft-gallery-slider-key="first">
      First card
    </article>
    <article data-wft-gallery-slider-slide data-wft-gallery-slider-key="second">
      Second card
    </article>
  </div>
</section>
```

For each root found by `[data-wft-gallery-slider]`, pass the mapping through the generated async
integration after checking the installed adapter version:

```ts
const slider = await createProjectSlider({
  target: root,
  structure: {
    track: "[data-wft-gallery-slider-track]",
    slides: "[data-wft-gallery-slider-slide]",
  },
  slideKeyAttribute: "data-wft-gallery-slider-key",
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

The track's direct parent is the container by default. If this contract adds a separate container
hook, map `structure.container` to `[data-wft-gallery-slider-container]`.

When adding optional controls with the matching names, build the controller's `swiper` options
through the shared vendor's exposed helper:

```ts
createWebflowSwiperOptions(root, {
  navigation: {
    previous: "[data-wft-gallery-slider-prev]",
    next: "[data-wft-gallery-slider-next]",
  },
  pagination: { element: "[data-wft-gallery-slider-pagination]" },
  swiper: { slidesPerView: 1.2, spaceBetween: 16 },
});
```

Configure only controls present in the contract; explicit missing selectors are errors. Use
`navigation: false` or `pagination: false` for unused controls when calling this helper.

Import `createProjectSlider` from the project's integration. Keep runtime adapter imports and optional `/webflow` helpers in the shared slider vendor, not in each addon. If exposing the controls helper from that vendor, update the integration's declared shared exports together with it. Rebuild and deploy the complete `dist/` tree after changing the dependency or vendor contract.
