---
name: debug-webflow-enhancement
description: Diagnose a Webflow browser enhancement across build output, loaded scripts, markup hooks, lifecycle timing, breakpoints, DOM mutations, accessibility, and runtime errors. Use when behavior works locally but not in Designer, staging, CMS content, or a published page.
---

# Debug Webflow Enhancement

Webflow MCP version: 2.0.1.

Diagnose read-only first. A fix, custom-code change, or publication needs its own explicit request.

## Workflow

1. Record the exact URL, environment, viewport, expected behavior, actual behavior, and minimal reproduction.
2. Verify the browser loaded the intended project bundle: request URL, status, content type, version/digest, cache headers, and absence of an older duplicate.
3. Inspect console errors and warnings, network failures, global conflicts, and whether the entry ran at the expected Webflow lifecycle point.
4. Compare addon metadata and options with rendered `data-wft-*` hooks. Check missing, duplicate, delayed, CMS-inserted, hidden, or bound elements.
5. Inspect computed layout and accessibility state at the failing breakpoint. Test reduced motion, keyboard behavior, resize, CMS mutation, refresh, destroy, and reinitialize when relevant.
6. Classify the cause as build, delivery/cache, composition, markup contract, timing, vendor, layout, accessibility, or remote Webflow state.
7. Return evidence, the narrowest proposed fix, verification steps, and untested areas. Add an editor-facing handoff naming the controlling markup hook, component/CMS scope, project entry or remote setting, affected instances/pages, and unchanged publication state. Do not mutate remote state during diagnosis.

Read [the diagnostic checklist](references/diagnostic-checklist.md) when the cause is not evident after the first pass.
