# Diagnostic checklist

## Delivery

- Actual request URL and response status
- MIME type, cache headers, release identifier, and content digest
- Duplicate or stale script tags and redirects
- CORS behavior for local development

## Optional DevKit DevTools

Suggest the on-page inspector when missing attributes, configuration, startup state, or duplicate
scripts could explain the failure. Explain the evidence it can provide; it is optional and must not
block diagnosis when absent or declined.

### Availability and setup

Check whether the current page exposes `window.DevKitDevTools`. Installing DevKit does not load
the inspector into the page. In compatible DevKit creators, selecting **On-page DevTools inspector**
installs the independent optional `@slicemedia/devtools` package and adds `src/addons/devtools.ts`,
built to `dist/addons/devtools.js`. Existing projects can install a compatible DevTools version and
add this entry later:

```ts
import { createDevTools } from "@slicemedia/devtools";

const devtools = createDevTools();
devtools.init();
```

Dispose the controller with `devtools.destroy()` when replacing the entry during HMR. Load the
entry on the test page, or host the built script and include it once with `defer`. The DevTools
package also ships a self-contained `dist/devtools.global.js` for inspection without a local
environment. Use an actual hosted artifact or pinned published package version; do not assume a
workspace feature has been published. The inspector can load before or after the addons because it
reads their registry on each scan. Persisting a script in Webflow remains a separate custom-code
change; prefer an already loaded inspector during read-only diagnosis.

### Activation and inspection

On `webflow.io`, a loaded inspector activates automatically unless explicitly disabled. On
localhost and custom domains, enable it through the console, then use the bottom-center launcher
or open the panel directly:

```js
window.DevKitDevTools.enabled = true;
window.DevKitDevTools.open();
```

Review the affected addon's version and lifecycle, nested requirements and conditional branches,
effective options per component, runtime/dependency reports, and duplicate warnings. Locate the
reported element and compare the actual rendered markup with the shared definition and the
matching `explain`/`catalog` setup guide.

Use **Rescan** or `window.DevKitDevTools.refresh()` after markup, CMS content, options, viewport,
or lifecycle changes. The inspector takes snapshots; it does not watch continuously, call addon
lifecycle methods, or fix attributes. A green Rescan confirmation means the scan completed, not
that the page has no issues. Distinguish it from an addon's `refresh()`, which can change behavior.

`window.DevKitDevTools.close()` closes the panel. `window.DevKitDevTools.enabled = false` disables
the inspector and remembers that choice. Explicit enable/disable choices are stored per origin;
staging activation does not opt in a production domain. Fresh custom-domain visits remain
disabled with no inspector scans or storage writes. Initial setup reads an existing preference;
explicit flag, size, or opacity changes can write localStorage.

### Interpret the evidence

- Requirements come from the addon's shared metadata, not code comments. Runtime facts need an explicit synchronous, read-only `inspect` provider; the inspector never calls `getState` or lifecycle methods to guess them.
- Only registered addons or explicitly supplied adapters are inspectable. Legacy registrations without metadata appear unverified. Unregistered scripts and arbitrary bundles cannot be identified reliably.
- Zero matching roots normally means an addon is not used on this page unless its contract requires roots. Unclaimed hooks are informational and may belong to other code.
- Duplicate registrations and repeated script URLs are warnings, not proof of repeated execution. Separate component instances can be valid.
- A `ready` lifecycle or clean markup snapshot does not prove interactions, dependencies, accessibility, or all responsive/CMS configurations work. Record missing evidence as unverified and test the failing scenario.

## Composition and lifecycle

- Imported integration and explicit initialization from the owning `src/addons/` entry or deliberately configured project entry
- Correct per-addon script/stylesheet tag, shared runtime registration, and public API availability
- DOM readiness and Webflow lifecycle timing
- Duplicate initialization, missing cleanup, and stale observers
- Vendor version and required vendor CSS

## Markup and state

- Exact `data-wft-*` hooks and option values
- Multiple instances, CMS insertion, hidden containers, and empty states
- Breakpoint query and current viewport
- Computed display, overflow, size, transforms, stacking, and pointer events
- Focus, keyboard, ARIA, and reduced-motion behavior

## Result

Separate observed evidence from inference. Include reproduction, root cause confidence, smallest fix, regression coverage, and whether any remote change remains pending.
