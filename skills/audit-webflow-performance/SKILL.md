---
name: audit-webflow-performance
description: Audit Webflow page performance and attribute costs to platform settings, assets, fonts, DOM and interactions, third-party scripts, or the site-owned project bundle. Use for Core Web Vitals diagnosis, regression analysis, or performance prioritization.
---

# Audit Webflow Performance

Webflow MCP version: 2.0.1.

Audit read-only. Do not change site settings, assets, scripts, Designer state, or publishing configuration without a separate explicit request and confirmed plan.

## Workflow

1. Define representative URLs, page/template types, consent and authentication states, geography, test date, and the release or bundle version. Capture a baseline before proposing changes.
2. Separate field evidence from lab evidence. For CrUX, record URL-level versus origin fallback, form factor, collection window, population, and every deployed release overlapping that window. Use version-segmented project RUM when available; use repeatable lab runs and browser traces to diagnose. Never present one Lighthouse score or a lab pass as proof of field Core Web Vitals or of the current release.
3. Test representative mobile and desktop conditions. Report LCP, CLS, and INP where the evidence source supports them; label TBT as a lab diagnostic proxy rather than INP.
4. Inventory the network waterfall, main-thread work, rendering, layout shifts, DOM size, fonts, media, embeds, interactions, custom code, and duplicate dependencies. Preserve request origin, transfer size, cache state, initiator, and timing evidence.
5. Attribute each finding to one owner: Webflow hosting/publishing settings; Webflow-managed assets or fonts; Designer structure, styles, DOM, or interactions; third-party scripts/embeds; or the site-owned project bundle. Keep shared causes split when evidence does not isolate one owner.
6. Isolate project-bundle impact in a non-production test by comparing the same remote markup with and without only that bundle. Use request and CPU attribution, source maps when available, and lifecycle traces; do not blame the bundle from correlation alone.
7. Rank fixes by user impact, confidence, effort, and owner. State the narrow verification experiment and risks for every recommendation.
8. Return an evidence table, mobile/desktop comparison, field/lab distinction, ownership, prioritized actions, uncertainty, and untested paths. Publication is never part of the audit.

Read [the performance evidence guide](references/performance-evidence-guide.md) before assigning a Core Web Vitals cause or comparing releases.

## Editor-facing handoff

For every recommendation, name the responsible owner/editor and control surface: Webflow site settings, Assets or Fonts panel, Designer structure/style/Interaction, CMS template or collection, third-party dashboard/embed, or local project bundle. State page/site and shared-instance impact, where future maintenance belongs, evidence and verification status, and that no recovery or publication action occurred during the audit.

## Stop conditions

Do not claim a regression or improvement when versions, content, consent state, cache state, or test conditions differ materially. Stop before remote mutation, destructive asset cleanup, script removal, or publishing until the user explicitly requests a separately planned change.
