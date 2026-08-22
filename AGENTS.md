# Slice Media Agent Kit repository guidance

This repository owns the canonical skills and adapter generator for `@slicemedia/agent-kit`.
Treat `skills/` and `content/rules/` as reviewed source; generated consumer files must not become a
second manually maintained instruction source.

## Boundaries

- Keep public project targets limited to Codex, Claude, Cursor, Copilot, and Webflow Agent Instructions.
- Preserve unknown consumer files. Generation may replace or remove only recorded Agent Kit outputs; `--force` requires deliberate review.
- Keep the Codex plugin skills-only. Use the official Webflow MCP server and do not bundle, proxy, or rename it.
- Keep Webflow referential in descriptions, not in the product name. Write the brand as “Slice Media” in prose and `slicemedia` in machine identifiers.
- Remote writes and publishing belong to explicit Webflow MCP workflows, never to this package or CLI.

## Commands

- `pnpm build`, `pnpm test`, `pnpm typecheck`, and `pnpm lint` validate the TypeScript package.
- `pnpm validate:package` validates plugin metadata, skills, CLI routing, and every adapter target.
- `pnpm sanitize` scans source and distributable artifacts for forbidden identifiers and likely secrets.
- `pnpm check` runs the complete local gate.
