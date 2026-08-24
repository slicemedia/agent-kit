---
name: configure-webflow-forms
description: Design progressive, accessible Webflow form enhancements and vendor-neutral submission integrations. Use for multi-step behavior, conditional fields, validation, consent, success/error handling, or CRM handoff planning.
metadata:
  surfaces: [local-agent]
---

# Configure Webflow Forms

Keep the native form usable without the enhancement and treat submitted data as sensitive.

## Workflow

1. Inventory fields, labels, required state, validation, consent, success/error states, spam controls, and destination.
2. Prefer native Webflow form handling when it satisfies the requirement.
3. Define enhancement hooks with `data-wft-*`; do not depend on generated class names or account-specific widget IDs.
4. Validate on the client for usability and on the receiving service for trust. Preserve server error messages in an accessible status region.
5. Prevent duplicate submissions, expose progress, restore focus after state changes, and keep browser autofill working.
6. Test keyboard use, screen-reader names, invalid fields, slow/offline requests, retries, duplicate clicks, and JavaScript-disabled fallback.
7. Return an editor-facing handoff that identifies which form definition or instance, fields, `data-wft-*` hooks, project code, and receiving service own each behavior; list affected forms/pages, verified states, remaining risks, and publication state without exposing submitted values.

Never log form payloads, embed secrets, pre-check consent, or send fields to an unspecified vendor. Put vendor behavior in an optional integration package.
