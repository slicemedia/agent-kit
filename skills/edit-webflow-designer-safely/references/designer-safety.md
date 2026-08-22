# Designer safety

- Read site Agent Instructions before planning names or design-system choices.
- Every page-building action needs the exact site and page context.
- A component definition can affect every instance; an instance prop should not mutate the definition.
- Removing a prop, variant, style, or variable can affect references that are not visible on the current canvas.
- `set_style` on an element replaces its style list; preserve required existing styles explicitly.
- Settings and bindings belong to `data_element_settings_tool`, not the general element tool.
- Component props and variants use their focused MCP 2.0.1 tools.
- Snapshots, live selection, active mode, branch, canvas navigation, and breakpoint inspection require the Designer bridge.
- MCP writes are governed by the authenticated user's Webflow permissions and appear in site activity history.
- Editing does not publish.

## Change risk and recovery

Classify risk from the inspected blast radius, not the user’s description alone:

- **Low:** a reversible, fully readable edit to one element or one exposed instance property with no shared-definition change.
- **Medium:** a bounded page-tree, binding, layout, or component-instance change whose dependencies and rollback state are fully captured.
- **High:** deletion; bulk or schema changes; a shared component, class, variable, interaction, or global embed change; structural movement across many elements; a migration; or any operation with incomplete dependency visibility.

For high risk, stop before mutation until one of these is recorded:

1. The user confirms Webflow shows all changes saved and a new manual restore point was created with a recognizable description; or
2. The user explicitly waives the restore point after the plan explains the blast radius, uncertainty, and recovery limitations.

Record only the confirmation or waiver and any user-supplied restore-point label. Do not invent a backup ID or claim an automatic backup is current. A screenshot or element snapshot helps verify appearance but cannot restore a site.

A restore point does not replace pre-state capture, small batches, read-back, staged verification, or activity receipts. Restoring a backup is a separate destructive decision: it can affect CMS content and identifiers, scheduled items, locales, comments, spam-protection settings, and integrations. Never restore automatically in response to a failed write.

Page branches and draft copies can reduce page-level risk when available, but shared classes, components, variables, and interactions may still cross boundaries. Re-evaluate the actual scope instead of treating a branch as universal isolation.

Current platform reference: [Save and restore Webflow backups](https://help.webflow.com/hc/en-us/articles/33961244069395-Save-and-restore-backups).
