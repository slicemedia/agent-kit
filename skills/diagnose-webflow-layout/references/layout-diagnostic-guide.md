# Webflow layout diagnostic guide

Reference snapshot: official sources reviewed 2026-08-21. Treat the live project and current Webflow documentation as authoritative.

## Isolate the failing constraint

Start at the visible defect and walk upward until the first element whose used size or position differs from the intended layout. Record authored and computed values separately. Check whether each element participates as a normal block, flex child, grid child, positioned element, or transformed descendant.

| Symptom                            | Inspect before changing anything                                                                          | Prefer                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Horizontal overflow                | Offending element bounds, fixed/min widths, unbroken content, transforms, negative offsets, grid minimums | Fix the source; avoid document-level `overflow: hidden` as a blanket patch       |
| Flex child will not shrink         | Parent direction/wrap, child basis, intrinsic minimum, width/min-width, replaced media                    | Adjust the responsible child or flex rule, preserving readable source order      |
| Grid overflows or leaves gaps      | Explicit/implicit tracks, fixed track minimums, spans, manual placement, auto-fit behavior                | Responsive tracks or deliberate breakpoint layouts rather than positional nudges |
| Absolute/sticky element drifts     | Containing block, ancestor positioning/transform/overflow, inset values, scroll container                 | Correct the intended containing or scrolling context                             |
| One breakpoint is wrong            | Value origin, base/combo class, pseudo state, cascade direction, adjacent custom breakpoints              | Change the lowest shared rule that expresses the design intent                   |
| Layout fails only with CMS content | Item count, empty values, text expansion, media ratio, conditional visibility                             | Make the layout tolerate the content contract; do not tune to one fixture        |

## Breakpoint reasoning

Webflow begins from the desktop breakpoint. Desktop styles cascade to larger and smaller breakpoints; tablet changes cascade down to both mobile breakpoints. A deletion changes structure everywhere, while display is a cascading style. Inspect the exact breakpoint that owns a value before clearing or replacing it, and test intermediate widths rather than only preset canvas sizes.

## Content and accessibility checks

- Test no items, one item, many items, long localized copy, an unbroken token, missing media, portrait and landscape media, browser zoom, and enlarged text.
- Keep logical reading and focus order aligned with DOM order. Flex or grid visual reordering does not change assistive-technology order.
- Avoid fixed heights for content that may grow unless clipping or scrolling is intentional and accessible.
- Verify that hidden content is intentionally unavailable; `display: none` leaves the element in published HTML but removes it from layout and interaction.

## MCP boundary

Read structure and styles headlessly. The bridge is needed for current canvas context, the site breakpoint list, and element snapshots. A snapshot is evidence of appearance, not proof of computed CSS or behavior. Current Webflow MCP cannot replace browser testing at arbitrary widths.

## Official sources

- [Webflow breakpoint cascade](https://help.webflow.com/hc/en-us/articles/33961300305811-Breakpoints-overview)
- [Webflow responsive-design concepts](https://help.webflow.com/hc/en-us/articles/33961293397779-Intro-to-responsive-design)
- [Webflow Flexbox](https://help.webflow.com/hc/en-us/articles/33961260795155-Flexbox)
- [Webflow Grid](https://help.webflow.com/hc/en-us/articles/33961365794451-Grid)
- [Webflow overflow troubleshooting](https://help.webflow.com/hc/en-us/articles/33961334731411-Overflow-hidden)
- [Webflow MCP architecture and bridge boundary](https://developers.webflow.com/mcp/reference/how-it-works)
