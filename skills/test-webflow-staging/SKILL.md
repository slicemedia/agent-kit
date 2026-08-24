---
name: test-webflow-staging
description: Verify a Webflow staging experience with browser, accessibility, interaction, and regression checks. Use after implementation checks pass and before any production publication.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Test Webflow Staging

Webflow MCP version: 2.0.1.

Verification is read-only and applies only to the explicitly configured staging host. Do not call any Webflow write action. Call `webflow_guide_tool` before any other Webflow tool. Require a rendered browser capability that can exercise the staging URL and inspect the necessary interaction, console, and network evidence. If it is unavailable, return an incomplete result and a manual checklist; do not report a pass.

## Workflow

1. Resolve the exact site with `data_sites_tool` action `get_site`, derive the Webflow staging origin from the returned site details, and confirm the URL matches it. Never trust a supplied URL alone. Stop if it resolves to a production or custom domain.
2. Record the publication target and relevant script versions loaded by the page.
3. Exercise every relevant breakpoint, multiple instances, CMS-rendered items, keyboard navigation, reduced motion, and empty/missing markup.
4. Check console errors, failed requests, duplicate assets, focus order, ARIA state, layout shifts, and duplicate behavior after repeated interactions or dynamic-content refresh.
5. Capture reproducible failures with URL, viewport, steps, expected result, actual result, and evidence.
6. Return a pass/fail/incomplete report. Add an editor-facing handoff naming the controlling component, CMS, attribute, or external project-code surface for every failure, affected pages or instances, loaded version, verification coverage, and unchanged publication state. Do not publish or alter custom code as part of testing.

Treat a version mismatch, unknown script origin, production redirect, or inaccessible critical interaction as a failed gate.
