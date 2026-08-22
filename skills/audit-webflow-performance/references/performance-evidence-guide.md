# Webflow performance evidence guide

Reference snapshot: official sources reviewed 2026-08-21. Thresholds and platform options can change; use the current official documentation when making release decisions.

## Evidence classes

| Evidence                                | What it establishes                                                           | What it does not establish                                            |
| --------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| CrUX or project RUM                     | Distribution of real-user experiences over its stated window and population   | The exact code path causing a metric                                  |
| Repeatable Lighthouse/PageSpeed lab run | A controlled diagnostic snapshot and potential opportunities                  | Field performance or a user's INP experience                          |
| Browser performance trace               | Main-thread, rendering, layout, and request activity for the captured session | Population-wide impact                                                |
| Network waterfall                       | Request origin, order, cache behavior, transfer, blocking, and initiator      | CPU cost after a script loads                                         |
| Controlled before/after                 | Effect under the controlled variables                                         | General causation if content, consent, cache, or release also changed |

Run enough repeated tests to expose variance and report the aggregation method. Keep mobile and desktop results separate. If field data is unavailable because the page has insufficient traffic, say so and do not relabel lab data as field data.

For CrUX, record the returned collection period, form factor, and whether the result is for the requested URL or only its origin. CrUX currently aggregates a rolling 28-day window, so inventory every release deployed during that period. Do not attribute the distribution to today's project bundle unless version-segmented RUM or another controlled source isolates it.

## Ownership inventory

### Webflow settings and generated delivery

Check the currently available publishing optimizations, page-specific/asynchronous JavaScript behavior, caching, and hosting response. Do not recommend toggles without checking custom-code execution-order dependencies.

### Assets and fonts

Record the LCP resource, intrinsic/rendered size, format, responsive variants, preload or lazy-loading behavior, and cache headers. Webflow responsive variants apply to qualifying inline uploads but not every source path or background-image case. Inventory families, weights, subsets, blocking behavior, and duplicate font sources.

### Designer structure and behavior

Inspect excessive DOM depth/quantity, hidden duplicate content, large CMS lists, layout shifts from unsized content, costly effects, unused styles, and repeated interactions. A health-scan warning is a lead, not proof of user impact.

### Third-party and project code

Separate analytics, consent, embeds, tag managers, widgets, and other vendors by request initiator and execution. Attribute project-bundle cost through its requests, parsed modules/source maps, long tasks, listeners, observers, layout work, and controlled disablement. Check duplicate vendor/runtime copies and code that initializes on pages without matching markup.

## Core Web Vitals interpretation

- LCP: identify the actual element/resource and divide response delay, load delay/duration, and render delay where tooling permits.
- CLS: capture both load and post-load shifts; associate each shift with moving elements and the insertion or size change that caused it.
- INP: use field/RUM interaction evidence when available, then reproduce the relevant interaction in a browser trace. TBT can help diagnose blocking lab work but is not INP.

## Report shape

For each finding provide: metric/symptom, URL and conditions, evidence, likely cause, owner, confidence, proposed action, risk, and verification. Separate observed facts from inferences.

## Official sources

- [Google Core Web Vitals workflows and lab/field distinction](https://web.dev/articles/vitals-tools)
- [Google Web Vitals measurement](https://web.dev/articles/vitals)
- [Chrome UX Report API and collection periods](https://developer.chrome.com/docs/crux/api)
- [PageSpeed Insights mobile, desktop, field, and lab data](https://developers.google.com/speed/docs/insights/v5/about)
- [Webflow site-speed guidance](https://help.webflow.com/hc/en-us/articles/33961401004819-How-do-I-optimize-site-speed-in-Webflow)
- [Webflow responsive images](https://help.webflow.com/hc/en-us/articles/33961378697107-Responsive-images)
- [Webflow per-page and asynchronous JavaScript](https://help.webflow.com/hc/en-us/articles/38265301927059-Understanding-per-page-JavaScript-and-asynchronously-loading-JavaScript)
- [Webflow site health scan](https://help.webflow.com/hc/en-us/articles/42204113114899-Run-a-health-scan-to-check-for-site-issues)
