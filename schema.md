---
layout: default
nav: schema
title: Schema
description: >-
  The JSON Schema for the Spectral ruleset format — one self-contained draft 2020-12 document,
  usable in any conforming validator.
permalink: /schema/
---

# The JSON Schema

One self-contained **JSON Schema draft 2020-12** document that validates a Spectral ruleset
expressed as JSON or YAML.

It replaces the five internal draft-07 meta-schemas that previously described the format only as
configuration for one linter's runtime, with that implementation's runtime hooks and
validator-specific error-message extensions removed. It validates in any conforming 2020-12
validator, with no bespoke tooling — which is the whole difference between a format you can
describe and one you have to reverse-engineer from somebody's `node_modules`.

<p>
  <a class="btn btn-primary" href="{{ site.schema_path }}">View the schema</a>
  <a class="btn btn-outline-secondary ms-2" href="{{ site.repo }}/blob/main{{ site.schema_path }}">On GitHub</a>
</p>

---

## The canonical URI

The schema is served from this site, alongside the specification that describes it:

```
https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json
```

That URI is also what the schema declares as its own `$id`, so a document and its identity agree.

It did not start that way. The `$id` originally pointed at a `raw.githubusercontent.com` URL on a
branch — mutable by definition, on a hostname this project does not control, and not something
anyone should cite in a national standard. That was a real defect, it was
[recorded as one]({{ site.issues }}/1), and it was fixed **before anything depended on it**, which
is the only cheap moment to fix it. Changing an `$id` breaks every downstream `$ref`; doing it on
day three costs nothing, and doing it after adoption costs everyone.

The old GitHub URL still serves the same bytes, so nothing that already referenced it is broken.
It is simply no longer the identity. Use the canonical URI.

---

## In an editor

Editors that understand JSON Schema give you completion and inline validation. The format reserves
no `$schema` key and rejects unknown root properties, so bind the schema from *outside* the document
rather than inside it.

For YAML rulesets, a modeline comment:

```yaml
# yaml-language-server: $schema=https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json
extends: spectral:oas
```

For JSON rulesets, map it by filename in `.vscode/settings.json`:

```json
{
  "json.schemas": [
    {
      "fileMatch": [".spectral.json", "*.ruleset.json"],
      "url": "https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json"
    }
  ]
}
```

Do not add a `$schema` property to the ruleset itself — the linter will reject it.

---

## In CI

Any draft 2020-12 validator will do:

```bash
npx ajv-cli validate --spec=draft2020 \
  -s schema/v1/spectral-ruleset.schema.json \
  -d .spectral.yaml
```

Validating a ruleset against this schema is a **stricter and earlier** check than running the
linter: it catches misspelled keywords, malformed `given` expressions, and structurally invalid
overrides before any document is linted.

---

## What it is verified against

The schema is checked against the real-world rulesets published across the API Commons, which it
accepts, and against a suite of malformed rulesets, which it rejects.

That is a reasonable bar for a schema and **not** a substitute for a conformance suite, which tests
something different: not whether a ruleset is well-formed, but whether two engines agree on what it
*does*. [That work is here](/conformance/).

---

## Provenance

The format described here originates in [Spectral]({{ site.up_repo }}) by Stoplight, licensed
Apache-2.0. This specification and schema were derived from the reference implementation's own
internal validation meta-schemas — `ruleset.schema.json`, `rule.schema.json`, `shared.json`,
`json-extensions.json`, and `js-extensions.json` — and from its guides, then re-expressed as a
single self-contained document.
