# Publishing to SchemaStore

[SchemaStore](https://www.schemastore.org/) powers JSON/YAML autocompletion and
validation in VS Code, JetBrains IDEs, and others. Listing the Spotlight ruleset
schema there means any file matching the patterns below gets Spotlight
completion and validation automatically — no per-file `$schema` needed.

## Catalog entry

Add this object to the `schemas` array in
[`schemastore/schemastore`](https://github.com/SchemaStore/schemastore) at
`src/api/json/catalog.json` (keep the array alphabetical by `name`):

```json
{
  "name": "Spotlight Ruleset",
  "description": "Spotlight (Spectral-compatible) ruleset for linting OpenAPI, AsyncAPI, Arazzo, APIs.json and other JSON/YAML API descriptions.",
  "fileMatch": [
    "*.spotlight.json",
    "*.spotlight.yaml",
    "*.spotlight.yml",
    "spotlight-ruleset.json",
    "spotlight-ruleset.yaml",
    "spotlight-ruleset.yml"
  ],
  "url": "https://api-commons.github.io/spotlight-spec/schema/v1/spotlight-ruleset.schema.json"
}
```

We reference the canonical `$id` URL directly (served from GitHub Pages) rather
than vendoring a copy into the SchemaStore repo, so the listing always tracks
`schema/v1/`. This is the schema's permanent versioned URL; a future breaking
revision ships at `schema/v2/` and gets its own catalog entry.

### Filename convention

The `fileMatch` globs above are deliberately Spotlight-specific so they do not
collide with Spectral's own `.spectral.{json,yaml,yml}` listing. If you adopt a
different convention for distributed rulesets (e.g. `*.ruleset.json`), add it to
`fileMatch` here and in your tooling at the same time.

## Submitting

1. Fork `SchemaStore/schemastore`.
2. Edit `src/api/json/catalog.json` — insert the entry above, alphabetically.
3. SchemaStore validates external-URL schemas in CI; confirm the `url` resolves
   (HTTP 200, valid JSON Schema 2020-12) before opening the PR:
   ```bash
   curl -fsSL https://api-commons.github.io/spotlight-spec/schema/v1/spotlight-ruleset.schema.json | head
   ```
4. Open a PR titled `Add Spotlight Ruleset`. SchemaStore review typically asks
   only that `fileMatch` patterns are specific and the schema URL is stable —
   both hold here.

## Pre-flight checklist

- [x] Schema validates as JSON Schema 2020-12 and is self-contained (no external `$ref`s).
- [x] Every property and `$def` carries a `description`; key defs carry a `title`.
- [x] Root-level `examples` are present and validate against the schema.
- [x] Canonical `$id` URL resolves over HTTPS (GitHub Pages).
- [x] `npm run check` (sync + validate) and `npm run check:catalog` pass.
