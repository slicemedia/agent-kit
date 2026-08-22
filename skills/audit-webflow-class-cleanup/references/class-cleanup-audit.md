# Class-cleanup audit model

Use this reference while building the evidence ledger or planning a confirmed removal.

## Classification

- `protected`: a direct or indirect reference exists, or the selector is required by a base/combo relationship, component, prop, variant, binding, custom attribute, interaction, embed, custom-code/runtime contract, third-party integration, accessibility state, or Webflow behavior.
- `conditional`: use depends on runtime data, locale, CMS item shape, page state, breakpoint, pseudo-state, conditional visibility, dynamically constructed selector, or a surface that could not be inspected completely.
- `no-reference-found`: the completed searches found no reference. This is an evidence statement, not a safety verdict and not a removal recommendation by itself.

Never use `unused`, `purge candidate`, or `no-reference-found` as a synonym for `safe to delete`.

## Coverage ledger

For each class or combo path, record:

- exact selector name, style identity, combo parents, and dependent combos;
- properties at every project breakpoint and pseudo-state, including variable modes;
- pages/elements and native component definitions, instances, props, variants, slots, and bindings searched;
- CMS template pages, representative item states, locales, custom attributes, and conditional visibility searched;
- interactions, embeds, site/page freeform code, registered/applied scripts, and third-party contracts searched;
- local source, configuration, generated bundles, CSS, source maps when available, and runtime selector construction searched;
- rendered routes and states checked at every project breakpoint, including keyboard and interaction states where relevant;
- evidence found, blind spots, classification, and keep-or-review recommendation.

Search exact tokens and selector-building patterns. A literal search cannot rule out concatenation, encoded names, minified lookup tables, CMS-provided values, or external scripts. Treat generated artifacts as supporting evidence and trace matches back to their maintained source when possible.

## Removal gate

A removal plan must include:

1. The exact selector identities and combo-parent behavior; never enable implicit cascading removal.
2. Fresh evidence covering every relevant surface, with `conditional` and `protected` entries excluded.
3. A manual Webflow restore point confirmed by the user, or the user's explicit waiver after the missing recovery coverage and consequences are stated. A Webflow restore affects the site rather than rolling back one selector; never restore automatically.
4. A distinct confirmation after the user sees the final set, coverage gaps, and validation plan.
5. A small batch and stop conditions for stale state, unexpected references, partial failure, or visual/behavioral regression.
6. Read-back plus rendered verification before another batch. Do not publish as part of cleanup.

## Webflow-specific limits

Use headless `data_*` tools for project data. Use the Designer bridge only when live canvas context, breakpoint discovery, selection, or snapshots are needed. Webflow MCP 2.0.1 does not create or apply Webflow Interactions, so do not claim complete interaction coverage from MCP data alone. The Designer's own unused-class cleanup also has narrower visibility than this cross-surface audit; its candidate list remains untrusted input to the ledger.

## Official references

This original summary was verified against official Webflow documentation on 2026-08-21:

- [MCP data tools](https://developers.webflow.com/mcp/tools/data-tools)
- [MCP Designer tools](https://developers.webflow.com/mcp/tools/designer-tools)
- [MCP 2.0.1 changelog](https://developers.webflow.com/home/changelog/2026/7/21)
- [Webflow Style selectors panel](https://help.webflow.com/hc/en-us/articles/33961365722899-Style-selectors-panel)
