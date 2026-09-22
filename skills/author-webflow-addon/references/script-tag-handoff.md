# Webflow script tag handoff

Use this handoff after creating or changing a public addon or optional project entry, including a
fix, or when explaining how to install/test an existing entry. Present the copyable snippets
directly to the user even when the agent already injected them for a browser test. A source-file
link, successful build, or instruction to run `explain` is not the complete handoff.

## Derive the actual setup

- Inspect the project's package manager, scripts, selected browser entries, addon metadata,
  dev-server origin/port, build manifest, and configured deployment base URL. Use the installed
  DevKit's `explain <name>` or `catalog` output to derive tags; pass the actual `--dev-url` and
  `--public-base-url` when needed. Do not guess paths from an addon label or invent a CDN host.
- Local tags load the browser entry with `type="module"`; a nested `.entry.ts` source path stays
  intact. Production tags use the actual built standalone `.js` path, with nested folders and
  configured overrides preserved. Do not point the user at an inert definition/helper module.
- Include production stylesheet tags only for emitted files recorded in the manifest. Vite
  handles CSS imported by local entries. Keep shared vendor JS/CSS under the project's existing
  loader; do not add duplicate vendor tags merely because several addons depend on that vendor.
- If a URL or runtime contract is unavailable, identify that missing value and mark the affected
  snippet pending or illustrative. Still give the verified parts; do not present placeholders as
  working URLs. Providing instructions does not authorize remote edits, deployment, or publishing.

## Present in this order

During development or local testing, use the order below. After a verified deployment, or when
the user asks specifically for production setup, lead with the CDN tags and their placement;
include local instructions only when relevant. Honor an explicit request for a narrower handoff.

1. **Start command.** Give the exact command in a `sh` fence for the project's package manager
   and scripts, including the approved testing origin when required. State the project directory,
   actual server URL/port, and that the server must remain running during the test. With DevKit's
   server, restart after shared vendor changes because those assets are built at startup.
2. **Local testing tags first.** Give the selected entry tags in an `html` fence. When HMR is
   enabled, include one module tag for the same server's `/@vite/client` before the addon tags;
   Webflow's HTML is not served by Vite, so the client is not automatically injected. If HMR is
   disabled or unavailable, omit that tag and state the reload procedure. Do not promise that
   every edit can update without a page reload.
3. **Exact placement and scope.** Name the page/template or site scope, the Webflow field below,
   and why that placement fits the addon's metadata. Keep local instructions limited to the
   approved test page/session. A persisted staging embed follows the separate Webflow write
   workflow and cleanup plan; never put development tags into production-bound code.
4. **Required markup and configuration.** List each attribute name, value, and owning root,
   child, or control. Include any necessary inline configuration/ready callback in a separate
   fenced snippet with its required order relative to the addon tag. Use the actual addon API;
   do not make the user infer setup from source code.
5. **CDN tags when available.** After an authorized deployment, verify the exact public JS/CSS
   responses and version or digest against the current build, then provide production tags in a
   separate `html` fence. A generated URL, pushed commit, or successful upload alone does not prove
   that the current bytes are served. If deployment has not happened, keep local testing primary;
   label known future tags as planned/unverified, or state that CDN tags are pending the base URL
   and deployment. Do not substitute an older live CDN script for the code being tested.

Use plain fenced code for commands, HTML, CSS, and inline JavaScript. Put a short placement note
immediately before each snippet; separate head styles from footer scripts. Include only the
selected entries. Explain how to suppress/replace their matching hosted tags during local testing
so local and CDN copies cannot initialize together, including site-wide tags affecting a test
page. Preserve unrelated scripts. For production handoff, include instructions to replace local/HMR
references with the intended hosted tags; perform remote cleanup only within its authorized
workflow. Report which URLs and interactions were verified and what remains pending.

## Webflow placement

| Scope and asset                                | Webflow field                                      |
| ---------------------------------------------- | -------------------------------------------------- |
| Behavior for one page or CMS template          | Page settings → Custom code → Before `</body>` tag |
| Behavior deliberately needed across the site   | Site settings → Custom code → Footer code          |
| Page stylesheet or justified early script      | Page settings → Custom code → Inside `<head>` tag  |
| Site-wide stylesheet or justified early script | Site settings → Custom code → Head code            |

Use body-end for ordinary behavior unless the addon declares an earlier requirement. Explain a
head exception, such as first-paint state or flicker prevention; preserve the declared loading
attributes and prefer `defer` for a classic head script when compatible. Keep manually linked CSS
in the head. If an existing Embed owns the integration, name that specific Embed instead of adding
another page/site copy. Snippets contain the tags to paste, not enclosing `<head>` or `<body>` tags.

Custom code can run in preview/comment modes; saving it does not publish it to live pages. State
whether the test uses a browser-session override, preview, or published staging and keep any
required staging publication separate from production publication.

Placement and module-client references: [Webflow custom code fields and preview behavior](https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags),
[Vite integration with externally served HTML](https://vite.dev/guide/backend-integration).
