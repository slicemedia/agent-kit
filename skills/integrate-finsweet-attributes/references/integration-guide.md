# Finsweet Attributes integration reference

Reference snapshot: current Finsweet Attributes v2 and Webflow MCP documentation, reviewed 2026-08-21. Finsweet Attributes, Client-First, and Finsweet Components are created and maintained by Finsweet. Slice Media Agent Kit is not affiliated with or endorsed by Finsweet. This is an original interoperability checklist; the live project and current official solution documentation take precedence.

## Select the owner before the implementation

Choose one primary owner for each behavior:

- Use native Webflow when its elements, CMS, forms, or interactions fully provide the behavior.
- Use Finsweet Attributes for a documented attribute-driven solution whose runtime and `fs-*` markup contract the project accepts.
- Use Finsweet Components only through its separate Webflow app and commercial/service decision.
- Use a Slice Media DevKit addon when the project needs site-owned code, a typed lifecycle, and a neutral `data-wft-*` contract.

Client-First can coexist with any of these because it governs structure and classes, not behavior runtime. Coexistence is not permission to let two systems own the same interaction.

## Current v2 baseline

At the review date, official new-work documentation loads the universal `https://cdn.jsdelivr.net/npm/@finsweet/attributes@2/attributes.js` URL as an asynchronous module. One library call can declare multiple solution keys and imports only their required modules. Verify the current copy block on the selected solution page immediately before implementation; the major-version URL is not proof of the exact deployed package version. During staging verification, inspect the response and the loaded solution controls' reported versions rather than inferring an exact build from `@2`.

- Inventory site code, page code, registered scripts, rendered HTML, and project source before adding the library.
- Keep one universal v2 library call per page. Add solution declarations to that call rather than creating duplicates.
- Record whether settings live on the script, a common ancestor, or the target element. A nearer declaration can override an inherited one, so moving a setting changes scope.
- Explicit solution declarations start loading earlier. Automatic discovery waits for a DOM scan; use it only when that tradeoff is intentional.
- Preserve existing v1 pages until migration is explicitly scoped. V1 solution packages, `fs-cms*` markup, and the `window.fsAttributes` API cannot run together on one rendered page with v2's universal script, unified solution keys, and `window.FinsweetAttributes` API. A site may intentionally keep v1 and v2 on different pages, provided site-wide custom code does not load both and the page boundary is inventoried, tested, and handed off clearly.

Before broadly replacing or removing custom code, or changing shared/bulk Attributes hooks, record a manually confirmed Webflow restore point. If the platform or project cannot provide one, proceed only after the user explicitly waives it and the receipt records that decision. DOM snapshots, screenshots, exported inventories, and post-write read-back help verification but do not restore remote state.

## Element, instance, and CMS contract

Build an inventory row for every hook: page, structured element ID, element type, attribute name/value, binding source, inherited settings, instance key, repeated component scope, and paired targets. Preserve attributes that belong to accessibility, analytics, CMS, other vendors, or project code.

For list solutions, inspect the Collection List's native pagination and every participating filter, field identifier, sort/load control, state element, and instance. Check static versus CMS data, item limits, pagination pages, query-parameter behavior, localization, empty results, optional fields, long values, and dynamically introduced items. Hidden machine-readable fields must remain bound correctly and must not create keyboard or screen-reader noise.

Do not assume Designer sample content proves a CMS mapping. Read the actual schema and bindings, then verify varied published items.

## Runtime interoperation

The v2 global API queues callbacks by solution key and exposes solution lifecycle controls. Use the current package README for the exact API surface. For list work, hook the documented render lifecycle rather than guessing when fetched or filtered items exist.

Before adding project code, inventory callbacks, hooks, observers, restarts, and listeners already attached to the solution. Make each project subscription idempotent and retain its cleanup. A broad mutation observer that repeatedly reloads or restarts Attributes risks duplicate listeners, lost state, and render loops.

Define load order between Webflow initialization, the Attributes module, the site's IIFE, consent tooling, analytics, and any library that reads or mutates the same nodes. Treat a missing CDN response as a real failure mode and preserve usable native content where the chosen solution permits it.

## Accessibility and staging checks

- Use native buttons, links, inputs, labels, and form groups for their intended actions. Preserve accessible names, keyboard order, visible focus, validation, and state semantics.
- Verify any modal, accordion, slider, filter, sort, or load UI against the solution's current accessibility contract. Do not add speculative ARIA that can drift from runtime state.
- Announce meaningful asynchronous result changes only when the interaction needs it; avoid noisy live regions.
- Respect reduced motion and ensure loading, empty, error, and no-JavaScript states remain understandable.
- Test the published staging output, not only Designer or Preview. Inspect the rendered script exactly once, console/network failures, all affected widths, CMS extremes, repeated instances, back/forward navigation, query restoration, and teardown or reinitialization caused by project navigation code.

## Official sources

- [Finsweet Attributes solutions](https://finsweet.com/attributes/)
- [Universal script and settings](https://finsweet.com/attributes/how-to-set-the-script-tag)
- [Finsweet Attributes v2 API source](https://github.com/finsweet/attributes/blob/master/packages/attributes/README.md)
- [List solution documentation](https://finsweet.com/attributes/list-filter)
- [List v2 API source](https://github.com/finsweet/attributes/blob/master/packages/list/README.md)
- [Finsweet Components](https://finsweet.com/components)
- [Client-First introduction](https://finsweet.com/client-first/docs/intro)
- [Webflow MCP architecture](https://developers.webflow.com/mcp/reference/how-it-works)
- [Webflow MCP data tools](https://developers.webflow.com/mcp/tools/data-tools)
- [Webflow MCP 2.0.1 release](https://developers.webflow.com/home/changelog/2026/7/21)
