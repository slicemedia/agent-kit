---
name: test-webflow-staging
description: Verify Webflow addons and integrations on a staging environment with browser, accessibility, lifecycle, and regression checks. Use after local tests pass and before any production promotion.
---

# Test Webflow Staging

Verify behavior only on the explicitly configured staging host.

## Workflow

1. Confirm the URL is the configured staging origin. Stop if it resolves to a production/custom domain.
2. Record the addon and script versions loaded by the page.
3. Exercise every relevant breakpoint, multiple instances, CMS-rendered items, keyboard navigation, reduced motion, and empty/missing markup.
4. Check console errors, failed requests, duplicate assets, focus order, ARIA state, layout shifts, and cleanup after refresh/destroy.
5. Capture reproducible failures with URL, viewport, steps, expected result, actual result, and evidence.
6. Return a pass/fail report. Add an editor-facing handoff naming the controlling component/CMS/attribute/project-code surface for every failure, affected pages or instances, loaded version, verification coverage, and unchanged publication state. Do not publish or alter custom code as part of testing.

Treat a version mismatch, unknown script origin, production redirect, or inaccessible critical interaction as a failed gate.
