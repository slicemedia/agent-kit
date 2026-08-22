# DigitalOcean Spaces safety

- The plan binds target, release version, paths, sizes, content types, and file digests.
- Credentials are never part of a plan, receipt, command argument, generated project file, or log.
- Apply must receive the exact reviewed plan ID and explicit confirmation.
- DigitalOcean Spaces does not support atomic conditional `PutObject`; never claim atomic no-overwrite behavior.
- Require bucket versioning status `Enabled`, content-digest object namespaces, and a complete `HeadObject` preflight before any `PutObject`.
- Skip only exact `ContentLength` plus `sha384` metadata matches; fail closed on occupied mismatches or ambiguous `HeadObject` responses.
- The HEAD-to-PUT interval is not atomic. Versioning preserves earlier versions if an external writer races. Never delete existing versions.
- The package exposes no delete, mutable-alias, or synchronization operation.
- Source drift after planning fails before upload.
- A partial failure receipt lists completed and failed keys; it does not authorize automatic cleanup or retry.
- Publishing or changing Webflow custom code is separate from uploading project artifacts.
