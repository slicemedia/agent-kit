# Browser enhancement rules

- Expose reusable behavior through typed addon metadata and lifecycle methods; keep ESM imports inert.
- Scope queries to an explicit root, support multiple instances, and use only documented `data-wft-*` hooks.
- Track and remove owned listeners, observers, timers, generated nodes, attributes, styles, and vendor instances.
- Reconcile missing or delayed DOM, CMS mutations, breakpoint changes, reduced motion, keyboard use, and destroy/reinitialize cycles when relevant.
- Use upstream library APIs and CSS rather than private forks or renamed structural classes.
- Keep third-party libraries optional. Only a consumer's composition entry decides what ships in its single browser bundle.
- Keep examples neutral, copyable, and explicitly imported; examples must never run from a package root import.
