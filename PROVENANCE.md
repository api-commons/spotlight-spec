# Provenance

`spotlight-spec` is **derived from** [Stoplight Spectral](https://github.com/stoplightio/spectral),
licensed under the Apache License 2.0. This document records exactly what was
taken, how it was transformed, and how to re-derive it.

## Source

- Upstream: https://github.com/stoplightio/spectral
- Branch / snapshot: `develop`, June 2026
- License: Apache License 2.0 (see [LICENSE](./LICENSE))

The Spectral ruleset format is defined internally by these source files:

| Upstream file | Defines |
| --- | --- |
| `packages/core/src/ruleset/meta/ruleset.schema.json` | The top-level ruleset object. |
| `packages/core/src/ruleset/meta/rule.schema.json` | An individual rule. |
| `packages/core/src/ruleset/meta/shared.json` | Severity, formats, `given`/path expressions. |
| `packages/core/src/ruleset/meta/json-extensions.json` | Portable `extends`/`function`/`format` (string/data form). |
| `packages/core/src/ruleset/meta/js-extensions.json` | Runtime `extends`/`function`/`format` (code form). |

Upstream resolves these against each other at runtime via Ajv using `$id`/
`$anchor` cross-references, and selects **either** the JSON or the JS extensions
file depending on whether the ruleset was authored as data or as JavaScript.

## Transformation

[`schema/v1/spotlight-ruleset.schema.json`](./schema/v1/spotlight-ruleset.schema.json)
is a single, self-contained bundle of the above, produced by:

1. **Merging** `ruleset.schema.json`, `rule.schema.json`, and `shared.json` into
   one document. Every cross-file `$ref` (`shared#…`, `rule.schema#`,
   `extensions#…`) was rewritten to an internal JSON-Pointer ref into a single
   `$defs` section (e.g. `shared#severity` → `#/$defs/Severity`).
2. **Choosing the portable extensions.** The `extends`, `function`, and `format`
   definitions come from `json-extensions.json` (the data form), because this
   specification describes serialized rulesets, not JavaScript-authored ones.
3. **Dropping runtime-only hooks.** The `x-spectral-runtime` keyword (a hook with
   no validation effect, used by the linter to mark alias/format/function
   resolution points) was removed. Removing it does not change which documents
   are accepted.
4. **Preserving `errorMessage`.** The ajv-errors `errorMessage` annotations were
   kept verbatim. Standard validators ignore them; ajv-errors uses them for
   friendlier messages. They carry intent and were left in place.

No other semantic changes were made. The accepted/rejected set of documents is
intended to match upstream's data-form rulesets exactly.

## Regeneration

The bundle is **generated, not hand-maintained**. The transformation above is
implemented in [`tools/sync-from-spectral.mjs`](./tools/sync-from-spectral.mjs):

```bash
# Re-derive from a local spotlight-cli / spectral checkout (or it downloads the fork):
npm run sync                       # writes schema/v1/spotlight-ruleset.schema.json
npm run sync -- --src ../spotlight-cli

# CI guard — fails if the committed schema has drifted from upstream:
npm run sync:check
```

To track a newer Spectral release: update the spotlight-cli fork, run
`npm run sync`, run `npm run validate`, and commit the regenerated schema. The
schema's `$id` is the canonical, versioned URL
`https://api-commons.github.io/spotlight-spec/schema/v1/spotlight-ruleset.schema.json`;
breaking changes to the format should be published under a new `schema/v2/`
path rather than mutating `v1`.

## Verification

`npm run validate` checks the bundle against the examples in this repo (valid
and invalid). During development it was additionally checked against real
Spectral ruleset fixtures from the upstream tree, including:

- `packages/cli/src/services/__tests__/__fixtures__/ruleset.json` — accepted.
- `packages/core/src/__tests__/__fixtures__/rulesets/{recommended,bare,disabled}.json` — accepted.
- `packages/ruleset-migrator/.../rules-variant-3/ruleset.yaml` — accepted.

Documents that this schema rejects and upstream also rejects (e.g. an
`aliases`-only document, which fails upstream's own `anyOf` requiring
`rules`/`extends`/`overrides`) confirm the bundle did not loosen the format.

## License & attribution

This repository is licensed under the Apache License 2.0, the same license as
upstream Spectral. The original copyright is held by Stoplight, Inc. See
[LICENSE](./LICENSE). Per Section 4 of the License, this file documents the
changes made and preserves attribution to the original work.
