# Local Webflow integration checklist

Reference snapshot: official sources reviewed 2026-08-21. Browser local-network policies and Webflow preview origins can change; inspect the current browser and platform behavior.

## Connection preflight

- Identify one remote `.webflow.io` staging or `.canvas.webflow.com` preview origin and one local entry. Do not treat an origin pattern as approval for every site.
- Record the actual Vite/dev-server version and check current maintainer security advisories. Use a patched supported version. Keep HMR's origin/token validation enabled; do not use `legacy.skipWebSocketTokenCheck` to make an older integration connect.
- Keep the server on loopback by default. If LAN access is necessary, bind deliberately and limit allowed hosts; wildcard host acceptance creates DNS-rebinding exposure.
- Configure CORS with the exact remote origin. `Access-Control-Allow-Origin: *` or an unrestricted dev-server CORS switch is not the default fix.
- If the Webflow preview or page enforces Content Security Policy, record the blocked directive and allow only the exact development script/connect origins for the test; do not weaken unrelated directives.
- Use a stable port and confirm the URL printed by the server matches the script URL. Verify HMR's HTTP client and WebSocket use a reachable, consistent host/port.
- Treat four mechanisms separately: HTTP CORS, the HMR WebSocket handshake and authorization, legacy PNA `OPTIONS` preflights and private-network headers when the browser emits them, and current local/loopback-network permission behavior. Record the actual mechanism, request, response, permission, and error; do not add obsolete headers speculatively or assume one mechanism satisfies another. Prefer a trusted local HTTPS setup or scoped tunnel when required; do not launch the browser with protections disabled.

## Load and HMR evidence

1. Capture the baseline page with no project bundle override.
2. Confirm only one project entry is present in the network and runtime.
3. Check status, JavaScript content type, response body/version, source map, initiator, CORS headers, and cache source.
4. Make a harmless local change and prove that HMR or the documented reload path delivered that exact version.
5. Verify the prior enhancement was destroyed before the replacement initialized. Duplicate logs, observers, listeners, controls, or vendor instances fail the test.
6. Reload with cache disabled, then restart the dev server and verify failure/recovery behavior.

## Real-markup checks

Use the remote page's actual element order, component instances, CMS output, conditional visibility, and Webflow-generated scripts. Test missing hooks and delayed elements as well as the expected path. Do not copy production markup into a maintained fixture as a substitute for this check.

## Zero-development-reference gate

Before handoff, search all inspected production-bound surfaces for:

- `localhost`, `127.0.0.1`, `[::1]`, `0.0.0.0`
- private IPv4 ranges used by the test
- temporary tunnel hostnames
- Vite or other dev-client/HMR entry paths

Inspect local production output and deployment configuration, plus Webflow site/page custom code and rendered staging/production HTML when access permits. Clear any session override and relevant browser/service-worker cache. If any surface cannot be inspected, report the gate as unverified rather than passing it.

## Official sources

- [Webflow external resources in preview and comment modes](https://help.webflow.com/hc/en-us/articles/40748357886227-Supporting-external-resources-in-previews-of-custom-code)
- [Webflow custom code placement and preview behavior](https://help.webflow.com/hc/en-us/articles/33961357265299-Custom-code-in-head-and-body-tags)
- [Vite server host, allowed-host, CORS, and HMR options](https://vite.dev/config/server-options)
- [Vite cross-origin dev-server advisory](https://github.com/vitejs/vite/security/advisories/GHSA-vg6x-rcgg-rjx6)
- [Vite WebSocket file-read advisory](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583)
- [MDN Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [MDN Local Network Access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access)
- [MDN Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control)
