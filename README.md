# Slice Media Agent Kit

Slice Media Agent Kit generates focused, reviewable AI guidance for teams building with Webflow.
One canonical source can produce only the adapters a project uses: Codex, Claude, Cursor, GitHub
Copilot, or Webflow Agent Instructions.

The package does not include an MCP server and does not perform remote Webflow writes. It works
alongside the official Webflow MCP server and keeps inspection, planning, confirmation, application,
read-back, and verification distinct.

## Install and run

Public release candidates are distributed from the `next` tag. Install one with the package
manager already selected by the consuming project.

With pnpm:

```sh
pnpm add --save-dev @slicemedia/agent-kit@next
pnpm exec slicemedia-agent-kit generate \
  --root . \
  --profile project \
  --targets codex,claude
pnpm exec slicemedia-agent-kit validate --root .
```

With npm:

```sh
npm install --save-dev @slicemedia/agent-kit@next
npm exec -- slicemedia-agent-kit generate \
  --root . \
  --profile project \
  --targets codex,claude
npm exec -- slicemedia-agent-kit validate --root .
```

With Yarn:

```sh
yarn add --dev @slicemedia/agent-kit@next
yarn exec slicemedia-agent-kit generate \
  --root . \
  --profile project \
  --targets codex,claude
yarn exec slicemedia-agent-kit validate --root .
```

`--targets` accepts any combination of `codex`, `claude`, `cursor`, `copilot`, and `webflow`.
Only selected adapters are generated. Run `slicemedia-agent-kit targets --json` to inspect the
machine-readable target list.

Focused skills are generated into each selected local agent's supported project directory:
`.agents/skills/`, `.claude/skills/`, `.cursor/skills/`, or `.github/skills/`. The Webflow target
receives a curated Markdown-only Agent Instructions ZIP plus a local integrity manifest. Only
workflows that are safe and useful with Webflow access enter that archive; repository, package,
local-development, slider, and deployment workflows remain local-agent guidance.

## Webflow-native Agent Instructions

Generate the site pack without installing another ChatGPT plugin or MCP server:

```sh
pnpm exec slicemedia-agent-kit generate \
  --root . \
  --profile project \
  --targets webflow
```

This creates `.slicemedia/agent-kit/webflow-agent-instructions.zip` and a sidecar manifest containing
the Agent Kit version, tested Webflow MCP version, archive digest, file digests, and included skill
allowlist. Review the archive, then import it through Webflow's Instructions panel. The imported
rules and skills stay with the site and can be read by Webflow's AI Assistant and external agents
connected through the official Webflow MCP server. A Webflow Shared Library can distribute reviewed
instructions across multiple sites.

The CLI never writes instructions to a remote site. Existing site instructions must be inspected and
diffed before an import or MCP update, unknown instructions must be preserved, and every mutation
still requires the focused workflow's confirmation. A useful first request in a new agent session is:
“Read this site's Agent Instructions, then use the relevant skill.”

The previous skills-only Slice Media Webflow Companion plugin is retired in favor of this site-native
delivery. Local Codex, Claude, Cursor, and Copilot adapters remain separate because they can also work
with repositories, package managers, build tools, and local project configuration.

## Runtime and platform support

Agent Kit supports Node 22.13 or newer in the Node 22 line and the maintained Node 24 line on Linux,
macOS, and Windows. The CLI, adapter generator, validation, and Git-backed local-profile privacy
checks run in a Linux and Windows CI matrix; macOS is covered by local release gates. Git must be
available on `PATH` when a project already has a Git marker so Agent Kit can fail closed if
repository privacy cannot be verified.

The local-profile helper rejects detected symlinks and hard links on every platform. On POSIX
filesystems it additionally sets the profile mode to `0600`. Windows does not implement POSIX mode
bits as a confidentiality boundary, so profile confidentiality there relies on the existing
Windows account and NTFS directory ACLs. Agent Kit does not create or alter Windows ACLs.

Repository sanitization accepts private release-denylist terms only as a JSON string array in
`SLICEMEDIA_FORBIDDEN_TERMS` or from an ignored local `.private/denylist.txt`. Findings identify only
the rule index and encoding kind; configured values are never printed. Set
`SLICEMEDIA_REQUIRE_FORBIDDEN_TERMS=true` for a gate that must fail when no private terms are
configured.

During the `0.x` series, the current `latest` minor line and the active release candidate on `next`
receive fixes. Older minor lines do not receive guaranteed backports. Public APIs and generated
output may change between minor releases; patch releases are intended to remain compatible within
their minor line. Node support follows the versions listed above. Maintenance is best-effort: the
project does not provide a support SLA or long-term support branches. Report bugs through GitHub
Issues and follow `SECURITY.md` for suspected vulnerabilities.

An exact version such as `0.1.0` identifies immutable package contents. npm's movable `next` and
`latest` dist-tags select which already-published version is the active candidate or general-use
release; the tags are not semantic versions themselves.

## Optional Client-First workflows

Agent Kit includes `build-webflow-with-client-first` for projects that explicitly select or already
use Finsweet Client-First. The skill plans semantic page structure, class reuse, native Webflow
components, CMS boundaries, variables, responsive behavior, and safe MCP application. It does not
make Client-First a default, migrate another class system automatically, or install Finsweet
Attributes or Finsweet Components.

The separate `audit-webflow-client-first` skill is strictly read-only. It distinguishes documented
conventions, recommended strategies, optional choices, and project-specific decisions; a site that
uses another coherent methodology is not reported as noncompliant.

For example, ask: “Use the existing Client-First conventions to inspect and plan this new Webflow
page. Show the structure, class ledger, component/CMS decisions, and blast radius before any
write.” Finsweet owns and maintains Client-First; Slice Media Agent Kit is independent and not
affiliated with or endorsed by Finsweet. Current
[official Client-First documentation](https://finsweet.com/client-first/docs) and the inspected
project’s conventions remain authoritative.

## Focused Webflow workflows

Agent Kit keeps specialized work progressively loaded instead of turning the root instructions into
one large manual. The focused suite includes:

- Client-First page construction and optional Finsweet Attributes integration as separate choices;
- native Webflow layout diagnosis and CSS, Webflow Interactions, or GSAP motion planning;
- explicit class-cleanup auditing and draft-first CMS/content migration;
- evidence-based performance auditing and local-bundle testing against approved Webflow staging markup;
- high-risk restore-point or waiver checkpoints and editor-facing scope handoffs.

The local-development workflow is generated only for local coding agents and is excluded from the
site-native Webflow Agent Instructions ZIP.

Inspection and planning never authorize a write. High-blast changes require a confirmed manual
Webflow restore point or a recorded waiver, followed by confirmation of the exact current plan.
Snapshots and screenshots are verification evidence, not restorable backups. Editing, staging,
publishing, and restoring remain separate decisions.

## Programmatic API

```ts
import { generateAdapters } from "@slicemedia/agent-kit";

await generateAdapters("/path/to/project", {
  profile: "project",
  targets: ["codex", "cursor"],
});
```

Project generation requires an explicit `targets` array; pass `[]` when only the neutral project
guide is wanted. Workspace-profile generation may intentionally omit `targets` to select all.

Generation is intended for a new project or a reviewed regeneration. Files created by a previous
run are recorded under `.slicemedia/agent-kit/`; unknown files are not removed. Use `force: true`
or CLI `--force` only to replace existing adapter-owned paths after review.

`WEBFLOW_PROJECT.md` is project-owned. Agent Kit creates a neutral guide only when the file is
missing, never overwrites an existing guide, and does not remove it when target selection changes.

## Optional local user profile

After generating a local agent adapter, explicitly ask the agent to configure a user profile when
you want it to adapt its conversational language and explanation depth. Codex and Claude load the
specialized `configure-agent-user-profile` skill; Cursor and Copilot follow the generated local
profile guidance. The agent interviews you about language and Webflow, web-development, and tooling
familiarity, shows a draft, and waits for confirmation before saving
`.slicemedia/agent-kit/user-profile.local.md`.

The profile command installs and verifies an exact project-root `.gitignore` rule before writing,
refuses profiles found in the index or reachable Git history, and never includes preference values
in its receipts. The profile is not owned by adapter generation and is excluded from Webflow Agent
Instructions. Missing profiles are silent. The same explicit workflow can review, replace, or
delete the local profile; deletion retains the ignore rule for safe recreation.

“Local” describes storage and distribution, not model processing. When an adapter reads the
profile, its recognized values enter the active AI agent/model context under that provider's
privacy terms. Agent Kit does not send those values to Webflow or unrelated services.

## Codex plugin

This repository is also a skills-only Codex plugin. Its `.codex-plugin/plugin.json` points to the
canonical `skills/` directory and deliberately declares no MCP server.

Safety-gated Codex skills that can write, delete, publish, migrate, deploy, or store local profile
data disable implicit invocation. Invoke them by their exact name, such as
`$edit-webflow-designer-safely`; an ordinary request must never cause the agent to bypass that gate.

AI assisted heavily in building this project. AI-generated code and guidance may contain defects;
production use still requires human review, accessibility and security checks, and project-specific
testing.

Slice Media Agent Kit is an independent project. It is not affiliated with, endorsed by, or an
official product of Webflow, Finsweet, OpenAI, Anthropic, Cursor, or GitHub. Product names and
trademarks belong to their respective owners. The official documentation and terms of each
platform remain authoritative.

Contributions are welcome under the [contribution guide](CONTRIBUTING.md) and
[Code of Conduct](CODE_OF_CONDUCT.md). Security reports should follow [SECURITY.md](SECURITY.md).
