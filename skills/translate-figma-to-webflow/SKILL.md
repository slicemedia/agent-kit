---
name: translate-figma-to-webflow
description: Translate a Figma design into a Webflow-first component, class, responsive, CMS, and interaction plan. Use when implementing or estimating Figma frames in Webflow while preserving native editing and accessibility.
---

# Translate Figma to Webflow

Map design intent to maintainable Webflow structure rather than reproducing coordinates mechanically.

## Workflow

1. Inspect frames, components, variants, tokens, content states, responsive intent, and motion.
2. Separate global tokens, reusable Webflow components, CMS-backed content, page composition, and optional code enhancements.
3. Define semantic HTML, class strategy, grid/flex behavior, image treatment, breakpoints, and accessibility behavior.
4. Prefer native Webflow layout, variables, components, CMS, and interactions.
5. Use `data-wft-*` only for behavior that needs a Slice Media DevKit enhancement. Keep site-specific values in project configuration.
6. Produce an implementation map and QA checklist across breakpoints, content extremes, keyboard navigation, and reduced motion.
7. Add an editor-facing handoff that maps each design decision to its Webflow variable, shared class, component definition or instance, CMS field, page composition, native interaction, or project enhancement; identify reuse scope, inferred details, remaining manual work, and publication state.

Do not publish, overwrite Designer state, or invent missing brand assets. Label inferences and request the minimum missing input.
