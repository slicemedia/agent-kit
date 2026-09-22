---
name: debug-webflow-enhancement
description: Diagnose a Webflow browser enhancement across build output, loaded scripts, markup hooks, lifecycle timing, breakpoints, DOM mutations, accessibility, and runtime errors. Use when behavior works locally but not in Designer, staging, CMS content, or a published page.
metadata:
  surfaces: [local-agent]
---

# Debug Webflow Enhancement

Webflow MCP version: 2.0.1.

Diagnose read-only first. A fix, custom-code change, or publication needs its own explicit request.

## Workflow

1. Record the exact URL, environment, viewport, expected behavior, actual behavior, and minimal reproduction.
2. Identify the addon or optional project entry that owns the failing behavior. Verify its script and any matching stylesheet: request URL, status, content type, version/digest, cache headers, and absence of an older duplicate. Inventory other loaded entries separately.
3. Inspect console errors and warnings, network failures, global conflicts, and whether the entry ran at the expected Webflow lifecycle point.
4. Suggest optional DevKit DevTools for registered addon diagnostics and follow [the DevTools checklist](references/diagnostic-checklist.md#optional-devkit-devtools) when available. Inspect its nested requirements, per-instance options, runtime/dependency reports, and duplicate warnings, then compare with rendered `data-wft-*` hooks. Rescan after relevant changes. If absent or declined, continue with console, network, metadata, and DOM evidence. Check missing, duplicate, delayed, CMS-inserted, hidden, or bound elements; treat unavailable diagnostics as unverified.
5. Inspect computed layout and accessibility state at the failing breakpoint. Test reduced motion, keyboard behavior, resize, CMS mutation, refresh, destroy, and reinitialize when relevant.
6. Classify the cause as build, delivery/cache, composition, markup contract, timing, vendor, layout, accessibility, or remote Webflow state.
7. Return evidence, the narrowest proposed fix, verification steps, and untested areas. Add an editor-facing handoff naming the controlling markup hook, component/CMS scope, project entry or remote setting, affected instances/pages, and unchanged publication state. Do not mutate remote state during diagnosis.

Use [the diagnostic checklist](references/diagnostic-checklist.md) for DevTools setup and when the cause is not evident after the first pass. A clean inspection snapshot is not a behavior test, and the inspector's `refresh()` does not call the addon's lifecycle `refresh()`.

When the user needs to reproduce a local test or an authorized fix changes a public entry, include
[the script-tag handoff](../author-webflow-addon/references/script-tag-handoff.md): the start
command, exact local tags and Webflow placement, required attributes, and verified CDN tags only
when the current build is deployed. Keep diagnostic findings separate from changes actually made.
