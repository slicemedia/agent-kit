---
name: test-webflow-local-development
description: Test one local site bundle against real remote Webflow markup while diagnosing CORS, HMR, local-network access, caching, and version mismatches. Use for local browser-enhancement integration before staging; do not use to persist or publish development URLs.
metadata:
  distribution: local-only
---

# Test Webflow Local Development

Webflow MCP version: 2.0.1.

This skill is local-only because site-native Webflow Agent Instructions cannot access the developer's repository or dev server.

Load exactly one local project entry against an explicitly identified remote Webflow page. Prefer session-only browser injection or request override so remote Webflow state remains unchanged.

## Workflow

1. Record the remote staging/preview URL, local entry URL, fixed port, dev-server and Vite versions when applicable, expected bundle version, target markup hooks, and baseline behavior without the local entry. Stop if the only available target is a production custom domain.
2. Confirm the dev-server version is supported and not affected by a current applicable security advisory. Start it on loopback unless another interface is explicitly required. Allow only the exact remote origin for CORS, use a fixed/strict port, preserve HMR WebSocket origin/token protections, and expose only the endpoint the client needs. Never enable Vite's `legacy.skipWebSocketTokenCheck`; use a patched integration or disable HMR and reload instead.
3. Inject the local entry for the current browser session. Remove or suppress the hosted project bundle for that session so local and hosted copies cannot initialize together. Persisting a development script in Webflow requires a separate confirmed, staging-only plan with a removal step.
4. Verify the script request status, content type, actual response, source map, `Origin`/CORS response, CSP result, and HMR WebSocket authorization separately. Record whether the browser uses a legacy Private Network Access preflight or current local/loopback-network permission behavior; do not treat CORS, WebSocket authorization, and local-network permission as interchangeable. If policy blocks the request, use an approved local certificate, narrow development-origin policy, or scoped tunnel; never disable browser security globally.
5. Prove which code ran using a development-only version marker or digest. Disable cache while iterating, test a hard reload, and distinguish a stale browser/service-worker response from the current dev server.
6. Test the real rendered markup: Webflow readiness, matching `data-wft-*` hooks, multiple/CMS instances, delayed content, breakpoints, reduced motion, errors, refresh, destroy, and reinitialize. Confirm each HMR update replaces behavior rather than stacking listeners or instances.
7. Stop and restart the server to exercise failure and reconnect behavior. Record console, network, HMR, and visible results; do not convert a browser-only success into a deployment claim.
8. Remove the session override or confirmed temporary staging reference. Scan site/page custom code where accessible, rendered staging and production HTML, production build output, and deployment configuration for loopback, private-IP, and development-tunnel URLs. A release gate passes only when zero such references remain; otherwise report failure or unverified state.

Read [the local integration checklist](references/local-integration-checklist.md) before changing dev-server network settings or accepting a test as release-safe.

## Safety boundary

Never save a localhost, loopback, private-network, or temporary tunnel URL to production-bound Webflow code. Remote writes require a separate explicit request, confirmation, read-back, and cleanup receipt. This skill does not publish.

## Editor-facing handoff

Name the tested page/template scope, local entry and owning repository module, Webflow markup/attribute contract, and any session-only override. Explain whether future changes belong in Webflow markup/custom code or the local bundle, what component/CMS/page/site instances are affected, and the test, cleanup, development-reference gate, publication, and recovery state.
