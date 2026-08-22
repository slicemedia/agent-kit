# Diagnostic checklist

## Delivery

- Actual request URL and response status
- MIME type, cache headers, release identifier, and content digest
- Duplicate or stale script tags and redirects
- CORS behavior for local development

## Composition and lifecycle

- Imported integration and explicit initialization from `src/main.ts`
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
