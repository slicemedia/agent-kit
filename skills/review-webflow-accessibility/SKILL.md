---
name: review-webflow-accessibility
description: Audit Webflow components and Slice Media DevKit addons for keyboard access, focus, semantics, ARIA, reduced motion, readable states, and lifecycle regressions. Use during implementation review, staging QA, or before release.
---

# Review Webflow Accessibility

Combine code inspection with rendered interaction testing; automated checks alone are insufficient.

## Checklist

1. Verify semantic elements, names, relationships, headings, landmarks, and meaningful image alternatives.
2. Complete every interaction using keyboard only. Check focus visibility, order, trapping, restoration, and disabled states.
3. Validate ARIA state changes against visible state and avoid redundant or unsupported roles.
4. Test zoom, narrow viewports, dynamic CMS content, empty states, and error/status announcements.
5. Enable reduced motion and ensure content remains understandable without animation.
6. Destroy and reinitialize addons; confirm no duplicate IDs, handlers, announcements, or focus side effects.
7. Report findings by impact with exact reproduction steps and a testable fix.
8. Add an editor-facing handoff that maps each finding to its controlling semantic element, shared class, component definition or instance, CMS content, interaction, or project enhancement; identify affected pages/instances, verified states, and untested areas.

Do not claim conformance from a partial audit. Distinguish automated results, manual observations, and untested areas.
