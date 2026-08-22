# Client-First conventions for Webflow work

Reference snapshot: Finsweet Client-First 2.1 documentation, reviewed 2026-08-21. Client-First is created and maintained by Finsweet. Slice Media Agent Kit is not affiliated with or endorsed by Finsweet. This is an original interoperability summary, not a copy of Finsweet documentation, CSS, assets, or cloneable content. The inspected project and current official sources take precedence.

## Decide whether the convention applies

Use Client-First only when the user selects it or inspection finds a convincing combination such as `page-wrapper`, `main-wrapper`, `padding-global`, `container-*`, `padding-section-*`, `section_*`, underscore folders, `is-*` variants, a Client-First style guide, and associated global styles. One familiar class does not prove adoption.

Version clues are evidence, not permission to migrate:

- v2 commonly uses `padding-global`, `section_[identifier]`, underscore folders, and an explicit `[folder]_component` root.
- v1 commonly uses `page-padding`, `section-[identifier]`, and older underscore conventions.
- Relume-derived, customized, and partially migrated projects may differ. Preserve their established system until a migration is explicitly chosen.

Client-First, Finsweet Attributes, and Finsweet Components solve different problems. Do not add Attributes behaviors, Components runtime code, scripts, licenses, or ownership assumptions as part of Client-First adoption.

## Core page structure

Use the project’s existing equivalents when present. A typical hierarchy is:

```text
page-wrapper
├─ nav_component                 outside <main>
├─ main-wrapper                  <main>
│  └─ section_home-hero          <section>
│     └─ padding-global + padding-section-large
│        └─ container-large
│           └─ home-hero_component
└─ footer_component              outside <main>
```

- `page-wrapper` contains the page and should not become a catch-all styling surface. Avoid global overflow clipping as a layout fix because it can break sticky descendants.
- `main-wrapper` owns the `<main>` landmark. Navigation and footer remain outside it.
- `section_[identifier]` makes page regions clear in Navigator and normally carries `<section>` semantics.
- `padding-global` owns horizontal page gutters only.
- `container-[size]` owns width, horizontal centering, and max width. Names, values, and number of sizes are project-specific.
- `padding-section-[size]` owns vertical section spacing. Full-bleed layouts may rearrange padding and container wrappers while keeping those responsibilities separate.
- Use section and div primitives with the project’s classes. Do not assume Webflow’s preset Container or Quick Stack is required by Client-First.

## Webflow structure and layout elements

Client-First names and organizes the result; it does not require one Add-panel primitive for every layout.

- Use semantic Section or Custom elements when their HTML meaning is intentional. Use a Div for neutral grouping.
- Use flex for a primarily one-dimensional row or column and grid for a two-dimensional layout. H Flex and V Flex are convenience starting points, not required class conventions.
- Use Quick Stack only when its generated structure, responsive controls, and the project’s existing approach make it the clearest choice. Do not introduce it merely because it appears in the Structure section of Webflow’s Add panel.
- Keep content order meaningful before styling. Inspect display, sizing, gap, alignment, overflow, positioning, and child behavior at every affected breakpoint.
- Separate section identity, horizontal gutter, max-width container, vertical spacing, and component layout so each class has an understandable responsibility.

## Class and folder decisions

- A utility expresses reusable CSS purpose and normally has no underscore, for example `text-size-large`.
- A custom class expresses a page, component, or element purpose and uses underscore folders, for example `team-list_headshot-image`.
- “Global” describes reuse scope; it does not define a special naming syntax.
- An `is-*` class is a true combo variant only when it inherits from a base class and the combined selector owns variant styles. Apply it after its base.
- Prefer one or two purposeful classes. A third needs a clear reason. Replace deep stacks with a focused custom class, wrapper, or meaningful variant.
- Name from general to specific and avoid unexplained abbreviations.
- Page-prefixed classes remain page-specific. Use general folders only for structures intentionally reusable across pages.
- Nested folders are optional. Adopt one understandable folder strategy for the project instead of mixing every documented pattern.
- Client-First does not prescribe a universal flex, grid, or column utility inventory. Build section and component layouts with project-specific custom classes unless the existing style guide defines reusable layout utilities.

Inventory a class before reuse. Record its selector, combo context, breakpoints, usage, component/CMS/custom-attribute dependencies, and proposed blast radius. Some classes that appear unused in the Style panel can still be supplied through CMS or component custom attributes or referenced by browser code.

## Components and composition

`[folder]_component` classifies the root of a complete, copyable Client-First structure. It does not create a native Webflow Component.

Create or reuse a native Webflow Component when structure and layout recur. Inspect before changing:

- whether the target is a definition or an instance;
- exposed properties and Collection-list configuration;
- variants and their style/layout differences;
- slots and nested reusable components;
- bindings and all known instances.

Avoid representing the same alternative through both a native component variant and an `is-*` class unless the project has a documented reason. Recheck current Webflow limitations for slots, Collection lists, nesting, and variants at execution time.

## CMS composition

Client-First does not define a CMS schema or mandatory CMS class names.

- Model fields around content meaning, not a single layout.
- Keep Collection-page templates and Collection-list anatomy native and maintainable.
- Apply project class conventions to rendered structures without claiming they are official CMS utilities.
- Plan empty states, optional fields, long titles and rich text, missing media, filtering, sorting, pagination, and localization where relevant.
- Introduce Finsweet Attributes, CMS Bridge, or Finsweet Components only through a separate, explicit decision.

## Typography, variables, spacing, and responsive behavior

- Style Body and semantic heading tags as project defaults. Use `heading-style-h*` only to change visual appearance, never semantic rank.
- Prefer `rem` for scalable dimensions where it fits the existing system. Do not alter the root font size or inject a fluid-size generator automatically.
- Reuse the project’s semantic variables and source palette. Current Webflow supports more variable types, modes, and functions than older Client-First documentation describes, so inspect live capabilities rather than freezing a colors-only rule.
- Use global spacing utilities where consistency helps. Use component custom classes or grid/flex gaps when that produces simpler, better-owned inner layout.
- Start from Webflow’s desktop base and inspect all smaller and larger breakpoint overrides before changing a shared class. Element hierarchy changes affect every breakpoint.
- Test arbitrary widths, not only preset breakpoints. Do not add a larger breakpoint casually; verify current platform behavior first.

## Semantic and accessibility checks

- Use native landmarks and elements whenever possible: one descriptive page H1, sequential section headings, links for navigation, and buttons for actions.
- Preserve logical source order and keyboard order.
- Provide visible focus treatment, meaningful names, form labels and errors, appropriate alt text, sufficient contrast, and zoom/text reflow.
- Respect reduced-motion preferences. Add ARIA only when native semantics are insufficient, and keep dynamic states synchronized with behavior.
- Defer implementation details to current Webflow accessibility capabilities. Do not repeat historical workarounds from older Client-First pages when Webflow now offers a native or custom semantic element.

## Migration and cleanup

Before converting, inventory the style guide, variables, global embeds, pages, all breakpoints, native components, CMS bindings, custom attributes, interactions, and runtime selectors. Present three real options: convert, rebuild, or retain the current system.

If conversion is selected:

- define a bounded order and avoid indefinite mixed conventions;
- create or rename deliberately instead of destructively overwriting shared selectors;
- preserve IDs, class order, component/CMS bindings, and behavior hooks;
- prevent duplicate global-style embeds and equivalent variables;
- verify every migrated page and content extreme on a staging publication.

Never purge a class solely because Designer reports no direct use. Search component properties, CMS/custom attributes, custom code, and local runtime source first.

## Official references

- [Client-First introduction](https://finsweet.com/client-first/docs/intro)
- [Core Structure](https://finsweet.com/client-first/docs/core-structure-strategy)
- [Class strategy: global and custom classes](https://finsweet.com/client-first/docs/classes-strategy-1)
- [Class strategy: combo classes and stacking](https://finsweet.com/client-first/docs/classes-strategy-2)
- [Folders strategy](https://finsweet.com/client-first/docs/folders-strategy)
- [Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy)
- [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy)
- [Variables](https://finsweet.com/client-first/docs/variables)
- [Semantic HTML](https://finsweet.com/client-first/docs/semantic-html-tags)
- [V1 to V2 migration](https://finsweet.com/client-first/docs/v1-to-v2)
- [Convert past projects](https://finsweet.com/client-first/docs/convert-past-projects)
- [Client-First changelog](https://finsweet.com/client-first/docs/changelog)
- [Webflow layout elements](https://help.webflow.com/hc/en-us/articles/33961378749715-Building-web-layouts)
