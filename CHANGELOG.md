# Changelog

## 0.2.2

### Patch Changes

- 8186c49: Prefer GSAP addons for custom animation work across generated rules, motion authoring, addon
  authoring, and related workflows. Honor explicit animation choices, keep markup and base styling
  in Webflow, and preserve CSS and native Interactions for suitable simple effects. Remove the
  requirement to prove native Interactions insufficient before choosing GSAP.
- 4a34e71: Document marked browser entries, recursive addon organization, unique public names, helper-file boundaries, and preserved build/CDN paths. Keep legacy conventions available for older projects and use actual build manifests for deployment handoff.
- 85e0793: Default slider work to Swiper while honoring explicit user choices. Document shared on-demand vendor delivery, window-load refresh diagnostics, and the actual stable Spaces deployment contract, including optional versioning, scoped invalidation, safe retries, and the distinction between stable embeds and version-pinned hosted registrations.

## 0.2.1

### Patch Changes

- Complete the standalone-addon documentation migration across repository rules, agent prompts,
  local integration checklists, performance and debugging guidance, deployment instructions, and
  related handoffs. Describe separate addon and optional project scripts consistently, verify each
  selected entry independently, and preserve unrelated scripts when testing.

## 0.2.0

### Minor Changes

- 4ec9703: Replace the broad Webflow adapter archive with a fail-closed, site-native Agent Instructions pack, add deterministic pack metadata and integrity validation, harden the canonical MCP workflows, and add a read-only Client-First audit skill.
- 077e877: Require a native Webflow restore point or informed waiver plus a separate final confirmation before every remote mutation, add opt-in CMS agent-tracking guidance, and require explicit locale scope for localized CMS creation.

### Patch Changes

- Replace universal `src/main.ts`/single-bundle guidance with independent public addon entries and
  optional project composition. Align generated browser rules and authoring, debugging, and local
  testing skills with per-addon script tags, shared runtime registration, and public API handoff.

This file records user-visible changes to Slice Media Agent Kit. The project follows semantic
versioning while its public API develops through the `0.x` series.

## 0.1.0

Initial public release candidate, distributed through npm's `next` tag.

- Generate selectively scoped instructions and focused skills for Codex, Claude, Cursor, GitHub
  Copilot, and Webflow Agent Instructions from one reviewed source.
- Provide Webflow workflows for inspection, safe Designer and CMS edits, attributes, custom code,
  forms, accessibility, staging, local development, debugging, performance, content migration,
  motion, sliders, Client-First, and optional integrations.
- Encode inspect, plan, confirm, apply, read-back, and verification boundaries for remote changes,
  including blast-radius review, partial-failure receipts, and separate publishing decisions.
- Add explicit local communication-profile onboarding with Git privacy checks and no automatic
  collection or generation-time ownership of profile data.
- Support Linux, macOS, and Windows with Node 22.13+ or Node 24, including cross-platform adapter,
  validation, and local-profile safeguards.
- Include a skills-only Codex plugin and keep the official Webflow MCP server external.
- Add package validation, skill evaluations, artifact sanitization, and a fail-closed npm `next`
  publication workflow using an exact reviewed archive and trusted publishing.
