---
name: review-webflow-accessibility
description: Audit Webflow experiences for keyboard access, focus, semantics, ARIA, reduced motion, readable states, and dynamic-state regressions. Use during implementation review, staging QA, or before release.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Review Webflow Accessibility

Webflow MCP version: 2.0.1.

Review read-only; do not call Webflow write or publication actions. Call `webflow_guide_tool` before any other Webflow tool. Combine Webflow structure inspection with rendered interaction evidence; automated checks alone are insufficient. Before claiming manual findings, confirm access to a rendered surface that supports viewport, keyboard, focus, and reduced-motion checks. If that capability is unavailable, limit the result to structure evidence, label manual checks untested, and do not claim conformance.

## Checklist

1. Verify semantic elements, names, relationships, headings, landmarks, and meaningful image alternatives.
2. Complete every interaction using keyboard only. Check focus visibility, order, trapping, restoration, and disabled states.
3. Validate ARIA state changes against visible state and avoid redundant or unsupported roles.
4. Test zoom, narrow viewports, dynamic CMS content, empty states, and error/status announcements.
5. Enable reduced motion and ensure content remains understandable without animation.
6. Repeat dynamic state changes and reopen interactive components; confirm no duplicate IDs, announcements, handlers, or focus side effects.
7. Report findings by impact with exact reproduction steps and a testable fix.
8. Add an editor-facing handoff that maps each finding to its controlling semantic element, shared class, component definition or instance, CMS content, interaction, or project enhancement; identify affected pages/instances, verified states, and untested areas.

Do not claim conformance from a partial audit. Distinguish automated results, manual observations, and untested areas.
