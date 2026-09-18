# Changelog

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
