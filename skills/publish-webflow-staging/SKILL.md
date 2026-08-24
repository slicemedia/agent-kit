---
name: publish-webflow-staging
description: Explicitly inspect, plan, and perform a staging-only Webflow publication through the official MCP workflow, then verify the rendered result. Use only when the user directly asks to publish an identified Webflow staging target.
metadata:
  surfaces: [local-agent, webflow-site]
---

# Publish Webflow Staging

Webflow MCP version: 2.0.1.

Publishing is independent from editing, custom-code application, and testing. No other workflow is permission to publish. Call `webflow_guide_tool` before any other Webflow tool and stop if the returned guide cannot confirm the required staging-only schema.

## Workflow

1. Require the exact site and staging target. Read site details and domains with `data_sites_tool`; never choose a site by similarity.
2. Consult the current official Webflow tool schema and safe-publishing guidance. Stop if the available action cannot express staging-only publication without custom or production domains.
3. Present the exact site, domains, outstanding changes, and intended scope. Reject a request that combines staging with production domains or bypasses confirmation.
4. Show the exact request body and require the user to reply with the literal word `publish`; generic replies such as `yes`, `y`, `ok`, `go`, or `confirm` are insufficient. Only then invoke `data_sites_tool` action `publish_site` once with `publishToWebflowSubdomain: true` and `customDomains: []`. Include no custom or production domain. If the current schema cannot express both fields exactly, stop without publishing.
5. Return the MCP response as acceptance of a publication request, not proof that deployment completed.
6. If rendered browser and network evidence is available, verify the staging URL, loaded bundle version, network requests, console, accessibility-critical path, and requested behavior. Otherwise report the publication request as accepted but rendered verification as unavailable; never claim success from MCP acceptance alone. Do not auto-republish after failure.
7. Return an editor-facing handoff with the exact site and staging domains, accepted publication scope, verification evidence, failures or unknowns, unchanged production domains, and whether another publication request remains necessary.

A request to build, edit, inspect, or test is not permission to publish.
