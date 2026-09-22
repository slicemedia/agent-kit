# Editor-facing handoff

For completed or reviewable work, end with a concise handoff for the person maintaining the Webflow project:

- name the exact site, branch, page, component, CMS collection, or local module without exposing secrets;
- classify scope as local code, one element, one component instance, every component instance, one page, shared class or variable, selected CMS items, collection schema, or site-wide;
- explain where future content, property, style, layout, and behavior edits belong and what else they affect;
- separate changed, preserved, not verified, and manual follow-up state;
- report validation evidence, staging and production publication state, and any recovery checkpoint or rollback limitation.

Do not tell editors to modify generated bundles, opaque identifiers, or reusable package internals when a project-owned Webflow field, component property, class, variable, attribute, or composition entry is the intended control surface.

## Browser addon setup

After creating or changing a public addon or optional project entry, including a fix, or explaining
how to use it, always give a copyable setup handoff directly in the response:

1. The project's actual dev-server command, testing origin, and server URL/port.
2. Local module tags first, including one `/@vite/client` tag when HMR is enabled, in an `html` fence.
3. The exact Webflow page/site custom-code field or existing Embed, scope, and placement reason;
   ordinary behavior goes before `</body>`, CSS in the head, and early scripts need justification.
4. Required attributes with their element roles and any inline configuration in copyable snippets.
5. Separate CDN script/CSS tags once deployment is available and the current bytes are verified;
   otherwise label known future tags planned/unverified or state what remains pending.

Lead with verified CDN tags after deployment or for a production-only setup request; include
local instructions when relevant. Honor an explicit request for a narrower handoff.

Derive paths from the project's metadata and actual build output using `explain`/`catalog` when
available. Never invent URLs or stylesheet files. Explain how to avoid loading local and hosted
copies together and remove development/HMR tags before production handoff. Browser injection by
the agent does not replace the user-facing snippets. Supplying snippets does not authorize Webflow
edits, deployment, or publishing. The `author-webflow-addon` skill's script-tag handoff reference
provides the full placement and verification procedure.
