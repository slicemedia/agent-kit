# Editor-facing handoff

For completed or reviewable work, end with a concise handoff for the person maintaining the Webflow project:

- name the exact site, branch, page, component, CMS collection, or local module without exposing secrets;
- classify scope as local code, one element, one component instance, every component instance, one page, shared class or variable, selected CMS items, collection schema, or site-wide;
- explain where future content, property, style, layout, and behavior edits belong and what else they affect;
- separate changed, preserved, not verified, and manual follow-up state;
- report validation evidence, staging and production publication state, and any recovery checkpoint or rollback limitation.

Do not tell editors to modify generated bundles, opaque identifiers, or reusable package internals when a project-owned Webflow field, component property, class, variable, attribute, or composition entry is the intended control surface.
