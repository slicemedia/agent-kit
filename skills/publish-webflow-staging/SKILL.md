---
name: publish-webflow-staging
description: Explicitly inspect, plan, and perform a staging-only Webflow publication through the official MCP workflow, then verify the rendered result. Use only when the user directly asks to publish an identified Webflow staging target.
---

# Publish Webflow Staging

Webflow MCP version: 2.0.1.

Publishing is independent from editing, custom-code application, and testing. The Slice Media DevKit CLI does not publish Webflow sites.

## Workflow

1. Require the exact site and staging target. Read site details and domains with `data_sites_tool`; never choose a site by similarity.
2. Consult the current tool schema and pinned official safe-publish skill. Stop if the available action cannot express staging-only publication without custom/production domains.
3. Present the exact site, domains, outstanding changes, and intended scope. Reject a request that combines staging with production domains or bypasses confirmation.
4. Require explicit confirmation, then invoke `data_sites_tool` action `publish_site` once with only the confirmed target. If its current schema cannot constrain publication to staging, stop without publishing.
5. Return the MCP response as acceptance of a publication request, not proof that deployment completed.
6. Once available, verify the staging URL, loaded bundle version, network requests, console, accessibility-critical path, and requested behavior. Do not auto-republish after failure.
7. Return an editor-facing handoff with the exact site and staging domains, accepted publication scope, verification evidence, failures or unknowns, unchanged production domains, and whether another publication request remains necessary.

A request to build, edit, inspect, or test is not permission to publish.
