# Client-First audit reference

Reference snapshot: Finsweet Client-First 2.1 documentation, reviewed 2026-08-24. Client-First is created and maintained by Finsweet. Slice Media Agent Kit is independent and is not affiliated with or endorsed by Finsweet. This is an original interoperability summary, not copied documentation, CSS, assets, or cloneable content. The inspected project and current official sources take precedence.

## Interpret evidence proportionally

- Client-First is optional. A non-Client-First system is not defective merely because it differs.
- Utility classes, folder depth, spacing strategies, and recommended `rem` values allow documented choices. Report inconsistency against the site's declared strategy, not personal preference.
- Existing projects may be safer to retain, adapt locally, or rebuild than to convert. Never recommend conversion without evidence of a meaningful benefit and a separately reviewed migration plan.
- An `fs-*` hook belongs to Finsweet Attributes, and an app-managed Finsweet Component belongs to Finsweet Components. Neither proves Client-First adoption.

## Audit categories

### Core structure

Compare relevant pages with the reference responsibilities often represented by `page-wrapper`, `main-wrapper`, `section_[identifier]`, `padding-global`, `padding-section-[size]`, and `container-[size]`. A different layer is divergence, not automatically a defect, when the site's system provides equivalent containment, spacing, semantics, and maintainability.

### Classes and folders

- Custom Client-First classes commonly use underscores for a component, page, or grouped relationship.
- Utility classes commonly use dash-separated names without underscores.
- A true variant combo class commonly uses `is-` after a meaningful base class.
- Names should be understandable and generally move from broad context to specific purpose.
- Flag deep stacks only when evidence shows reduced clarity, control, or editability. Distinguish stacked utilities from a combo class that creates an additional declaration.
- Underscore-based virtual folders require the Finsweet Extension for its folder UI. MCP-visible names cannot prove that extension is installed or healthy.

### Typography, spacing, units, and variables

- Keep semantic heading rank separate from visual heading style.
- Recognize documented spacing choices, including spacer elements, wrappers, direct custom-class spacing, and grid or flex gaps. Do not require utility spacing everywhere.
- Client-First recommends `rem` for many scalable dimensions; approved values are recommendations, and legitimate exceptions such as one-pixel borders exist.
- Do not invent a mandatory size-variable system. Preserve an established semantic variable vocabulary when it is coherent.

### Components, CMS, semantics, and interactions

- A `[folder]_component` class describes a Client-First structure; it does not prove a native Webflow Component definition exists.
- Inspect shared definitions separately from instances, and identify blast radius before recommending any future change.
- Client-First does not prescribe a CMS schema. Assess whether templates and bindings are maintainable without treating project-specific CMS naming as a violation.
- Structural semantics are evidence, not a full accessibility audit. Keyboard, focus, contrast, motion, screen-reader, and rendered responsive behavior require separate evidence.
- Clear project-specific interaction names can be acceptable even when they differ from an optional naming convention.

## Official references

- [Client-First documentation](https://finsweet.com/client-first/docs)
- [Introduction](https://finsweet.com/client-first/docs/intro)
- [Core structure](https://finsweet.com/client-first/docs/core-structure-strategy)
- [Class strategy: global and custom](https://finsweet.com/client-first/docs/classes-strategy-1)
- [Class strategy: combo classes and stacking](https://finsweet.com/client-first/docs/classes-strategy-2)
- [Utility systems](https://finsweet.com/client-first/docs/utility-class-systems)
- [Folders strategy](https://finsweet.com/client-first/docs/folders-strategy)
- [Spacing strategy](https://finsweet.com/client-first/docs/spacing-strategy)
- [Typography strategy](https://finsweet.com/client-first/docs/typography-strategy)
- [Variables](https://finsweet.com/client-first/docs/variables)
- [Sizes and rem](https://finsweet.com/client-first/docs/sizes-and-rem)
- [Semantic HTML](https://finsweet.com/client-first/docs/semantic-html-tags)
- [Interactions naming](https://finsweet.com/client-first/docs/interactions-naming)
- [Converting existing sites](https://finsweet.com/client-first/docs/convert-past-projects)
- [Finsweet Attributes product boundary](https://finsweet.com/attributes/how-finsweet-attributes-works)
- [Finsweet Components product boundary](https://finsweet.com/components)
