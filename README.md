<p align="center"><a href="https://spotlight-rules.com"><img src="https://raw.githubusercontent.com/api-commons/spotlight-spec/main/spotlight-rules-logo.png" alt="Spotlight Rules" height="90"></a></p>

# Spotlight Spec

**A standalone specification of the Spotlight ruleset format — the rules and
rulesets used to lint JSON/YAML API descriptions — with a JSON Schema for
validation.**

Maintained by [API Commons](https://github.com/api-commons). The linter that
consumes these rulesets lives in
[spotlight-cli](https://github.com/api-commons/spotlight-cli) (a fork of
[Stoplight Spectral](https://github.com/stoplightio/spectral)).

---

## Why this repo exists

In Spectral the ruleset format is real, widely used, and carefully specified —
but it lives *inside* the linter's source tree, split across several internal
schema files in `packages/core/src/ruleset/meta/`. There is no separately
published, implementation-neutral artifact you can point a tool, a CI job, or an
editor at to answer "is this a valid ruleset?"

`spotlight-spec` extracts that format into its own thing:

- **One self-contained JSON Schema** ([`schema/v1/spotlight-ruleset.schema.json`](./schema/v1/spotlight-ruleset.schema.json))
  that validates a ruleset document on its own, with no linter runtime required.
- **A written specification** ([`spec/SPECIFICATION.md`](./spec/SPECIFICATION.md))
  describing every field.
- **Worked examples** ([`examples/`](./examples/)) — valid and invalid — that
  double as the test suite.

This lets rulesets be authored, validated, shared, and tooled independently of
any single linter implementation.

## What a ruleset is

A ruleset is a JSON or YAML document declaring a set of **rules**. Each rule
selects nodes in a target document with a JSON Path expression (`given`) and
applies a **function** (`then`) — `truthy`, `pattern`, `enumeration`, a custom
function, etc. — at a chosen **severity**. Rules can be grouped, inherited from
parent rulesets (`extends`), scoped to document `formats` (OpenAPI 2/3,
AsyncAPI, Arazzo, …), reused through `aliases`, and adjusted per-file or
per-JSON-Pointer with `overrides`.

```yaml
# api-style-guide.yaml
description: A tiny API style guide.
formats: [oas3, oas3_1]
rules:
  operation-needs-summary:
    description: Every operation should have a summary.
    given: $.paths[*][get,put,post,delete,patch]
    severity: warn
    then:
      field: summary
      function: truthy
```

See [`spec/SPECIFICATION.md`](./spec/SPECIFICATION.md) for the full field
reference and [`examples/`](./examples/) for more.

## Validate a ruleset

Any JSON Schema (draft-07) validator works. With [`ajv`](https://ajv.js.org):

```bash
npm install
npm run validate        # validates everything under examples/
```

To validate your own file with ajv-cli:

```bash
npx ajv-cli validate \
  -s schema/v1/spotlight-ruleset.schema.json \
  -d path/to/your-ruleset.yaml \
  --strict=false
```

The schema also works as an editor "$schema" association, e.g. in VS Code via
the YAML/JSON Schema settings, to get inline validation and autocomplete while
authoring rulesets.

## Spotlight extensions

Beyond the Spectral baseline, Spotlight adds its own first-class properties. The
first is **`tags`** on a rule — namespaced strings that classify it so tooling can
group and filter rules:

- `format:<artifact>` — the artifact type (`format:openapi`, `format:apis-json`, …)
- `spec:<location>` — where in the document it applies (`spec:operations`, `spec:responses`, `spec:schemas`, …)
- `experience:<dimension>` — the developer-experience / quality dimension it improves (`experience:documentation`, `experience:security`, `experience:error-handling`, `experience:naming`, `experience:consistency`, `experience:versioning`, `experience:pagination`, `experience:discoverability`, `experience:reliability`, `experience:data-modeling`, `experience:usability`, `experience:governance`)
- `source:<provider>` — provenance

```yaml
rules:
  responses-define-error-schema:
    given: $.paths[*][*].responses
    then: { ... }
    tags:
      - format:openapi
      - spec:operations
      - spec:responses
      - experience:error-handling
      - experience:reliability
```

## Relationship to Spectral

This specification is **derived from** Stoplight Spectral and is intended to stay
compatible with the rulesets Spectral (and spotlight-cli) consume. The schema
here is a faithful bundle of Spectral's own internal meta-schemas, reconciled
into a single portable document and stripped of runtime-only hooks. It is
validated against real Spectral ruleset fixtures (see `npm run validate` and
[`PROVENANCE.md`](./PROVENANCE.md)).

Where the portable format and the JS-authored format diverge (custom functions
provided as code, `extends` pointing at imported modules), this spec describes
the **portable, serialized** form — the one you can put in a `.yaml`/`.json`
file and hand to another tool. See [`PROVENANCE.md`](./PROVENANCE.md) for the
exact mapping back to upstream source files.

## Layout

| Path | What |
| --- | --- |
| [`schema/v1/spotlight-ruleset.schema.json`](./schema/v1/spotlight-ruleset.schema.json) | The standalone JSON Schema. |
| [`spec/SPECIFICATION.md`](./spec/SPECIFICATION.md) | Human-readable specification. |
| [`examples/`](./examples/) | Valid example rulesets. |
| [`examples/invalid/`](./examples/invalid/) | Intentionally-invalid rulesets (negative tests). |
| [`tools/validate.mjs`](./tools/validate.mjs) | Validation harness / test runner. |
| [`PROVENANCE.md`](./PROVENANCE.md) | Mapping to upstream Spectral source + license. |

## License

Apache License 2.0 — see [LICENSE](./LICENSE). Derived from Stoplight Spectral
(Apache-2.0); attribution and provenance are recorded in
[PROVENANCE.md](./PROVENANCE.md).

---

Part of [Spotlight Rules](https://spotlight-rules.com) — a project of [API Evangelist](https://apievangelist.com), maintained openly under [API Commons](https://apicommons.org).
