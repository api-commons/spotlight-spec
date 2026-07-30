# Spotlight Spec

**A standalone specification and JSON Schema for the Spectral ruleset format.**

Spectral rulesets are the most widely adopted machine-readable format for API governance
rules. Thousands of organizations describe their API style guides, security baselines, and
design standards as a Spectral ruleset, then run those rules in CI against every OpenAPI,
AsyncAPI, Arazzo, and JSON Schema document they ship.

But the format has never been specified. It exists only as configuration for one linter,
described by five internal draft-07 meta-schemas coupled to that linter's runtime, versioned
with the tool rather than on its own. That makes an organization's governance rules —
arguably the most durable, most portable artifact an API program produces — dependent on the
lifecycle of a single CLI.

This repository treats the ruleset as a first-class artifact in its own right: an
independently versioned specification with a portable JSON Schema, so rules can be authored,
validated, published, exchanged, and consumed by any tool, not just by the linter that
happens to run them.

- **Website** — **[spec.spotlight-rules.com](https://spec.spotlight-rules.com)** — this document
  in context, plus the roadmap to a formal specification, the versioning proposal, and the
  conformance plan.
- **Specification** — this document.
- **JSON Schema** — [`schema/v1/spectral-ruleset.schema.json`](schema/v1/spectral-ruleset.schema.json)
  (JSON Schema draft 2020-12), also served at
  [`spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json`](https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json).
- **Reference implementation** — [api-commons/spotlight-tools](https://github.com/api-commons/spotlight-tools),
  the API Commons build of [stoplightio/spectral](https://github.com/stoplightio/spectral).

> **Status: draft. The name is Spotlight.**
> The format described here is the Spectral ruleset format as implemented today, documented
> faithfully and without extension — the *format* keeps its lineage and its name in prose,
> because that is what your rulesets are and pretending otherwise would help nobody. What is
> named Spotlight is this specification effort and its two repositories:
> [spotlight-spec](https://github.com/api-commons/spotlight-spec) and
> [spotlight-tools](https://github.com/api-commons/spotlight-tools). That was settled immediately
> rather than left open, because asking people to adopt a new scope, a new issue tracker, and a
> new schema identity under somebody else's name builds a mess into the foundation — and a rename
> after adoption is far more expensive than one before it.
>
> The document itself is still a draft. The `v1` schema identity is not: see
> [Versioning](#versioning).

### Why this is separate from the linter

The rules and the tool that runs them have always shipped as one thing, and that coupling is
the failure this repository is meant to fix. When the linter stops moving, the format stops
moving with it — and an organization's governance rules are usually the most durable thing an
API program produces. They outlast the CLI, the vendor, and often the API itself.

So: **the rules stand on their own.** Specified, independently versioned, portable, and
implementable by anyone. The reference implementation stays aligned with this document rather
than the other way around — and other engines are welcome to implement it. That includes
[vacuum](https://github.com/daveshanley/vacuum), which is a supported and valued
implementation; a written specification with a public conformance suite is precisely what
lets several engines coexist honestly instead of drifting apart on undocumented behavior.

### Where things go

| What | Where |
|---|---|
| **Problems with the format, the schema, or this spec** | [spotlight-spec/issues](https://github.com/api-commons/spotlight-spec/issues) |
| **Problems with the CLI or engine** | [spotlight-tools/issues](https://github.com/api-commons/spotlight-tools/issues) |
| **Direction, governance, naming, where this should live** | [the discussion thread](https://github.com/orgs/api-commons/discussions/28) |

If you depend on the Spectral ruleset format, **say so in the discussion.** Knowing who relies
on it is what makes the case for a real, permanent home.

---

## Contents

- [Using the schema](#using-the-schema)
- [The Ruleset Object](#the-ruleset-object)
- [Rules](#rules)
  - [The Rule Object](#the-rule-object)
  - [`given` and path expressions](#given-and-path-expressions)
  - [`then` and functions](#then-and-functions)
  - [`severity`](#severity)
  - [`formats`](#formats)
  - [`message`](#message)
  - [Rule shorthands](#rule-shorthands)
- [`extends`](#extends)
- [`aliases`](#aliases)
- [`overrides`](#overrides)
- [`parserOptions`](#parseroptions)
- [Custom functions](#custom-functions)
- [Extension properties](#extension-properties)
- [Conformance notes](#conformance-notes)
- [Versioning](#versioning)
- [Provenance and license](#provenance-and-license)

---

## Using the schema

The schema validates a ruleset expressed as JSON or YAML. Its canonical `$id` is:

```
https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json
```

**In an editor.** VS Code and other JSON Schema-aware editors give you completion and inline
validation. The format reserves no `$schema` key and rejects unknown root properties, so bind
the schema from outside the document rather than inside it.

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

Do not add a `"$schema"` property to the ruleset itself — the linter will reject it.

**In CI.** Any draft 2020-12 validator will do:

```bash
npx ajv-cli validate --spec=draft2020 \
  -s schema/v1/spectral-ruleset.schema.json \
  -d .spectral.yaml
```

Validating a ruleset against this schema is a stricter and earlier check than running the
linter: it catches misspelled keywords, malformed `given` expressions, and structurally
invalid overrides before any document is linted.

---

## The Ruleset Object

A ruleset is a single JSON or YAML object. It **MUST** declare at least one of `extends`,
`rules`, or `overrides` — a ruleset that contributes nothing is invalid.

| Field | Type | Description |
| --- | --- | --- |
| `description` | `string` | Human-readable description of what this ruleset governs. |
| `documentationUrl` | `string` (URL) | Documentation for the ruleset as a whole. Used as the fallback documentation link for any rule that does not declare its own. |
| `formats` | [Formats](#formats) | Document formats the ruleset applies to. Default for every rule that does not declare its own. When omitted, rules apply to every document. |
| `extends` | [Extends](#extends) | Other rulesets this one inherits from. |
| `rules` | `object` | Map of rule name to [Rule Object](#the-rule-object). |
| `aliases` | [Aliases](#aliases) | Named, reusable path expressions. |
| `overrides` | [Overrides](#overrides) | Per-file and per-location adjustments. |
| `parserOptions` | [ParserOptions](#parseroptions) | Severities for problems in the document itself, before rules run. |
| `functions` | `string[]` | Names of [custom functions](#custom-functions) to load. Serialized rulesets only. |
| `functionsDir` | `string` | Directory custom functions load from. Defaults to `functions`. |
| `x-*` | any | [Extension properties](#extension-properties). |

No other properties are permitted at the root.

A rule name is the stable identifier reported in lint results and used to reference the rule
from a consumer's `extends` or `overrides`. Rule names are the ruleset's public API: renaming
one silently breaks every downstream ruleset that disables or re-severities it.

```yaml
description: Acme API style guide
documentationUrl: https://engineering.acme.com/api/governance
extends: [[spectral:oas, recommended]]
formats: [oas3]
rules:
  acme-operation-summary:
    description: Every operation needs a summary.
    severity: error
    given: $.paths[*][get,put,post,delete,options,head,patch,trace]
    then:
      field: summary
      function: truthy
```

---

## Rules

A rule is the unit of governance: **where to look** in a document, and **what must hold**
there.

### The Rule Object

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `given` | [Given](#given-and-path-expressions) | ✔ | The part or parts of the document the rule applies to. |
| `then` | [Then](#then-and-functions) | ✔ | The assertion, or assertions, applied to each matched node. |
| `description` | `string` | | What the rule requires, in prose. |
| `message` | `string` | | Template for the reported message. See [`message`](#message). |
| `severity` | [Severity](#severity) | | How results are reported. Defaults to `warn`. |
| `formats` | [Formats](#formats) | | Formats this rule applies to. Overrides the ruleset-level `formats`. |
| `documentationUrl` | `string` (URL) | | Where to read about the rule and how to satisfy it. |
| `recommended` | `boolean` | | Whether the rule is on when a consumer extends the ruleset in `recommended` mode. Defaults to `true`. |
| `resolved` | `boolean` | | Whether the rule sees the document with `$ref`s resolved. Defaults to `true`. |
| `tags` | `string[]` | | Free-form labels for grouping and filtering. |
| `type` | `"style"` \| `"validation"` | | Coarse classification. `validation` asserts correctness, `style` asserts convention. |
| `extensions` | `object` | | Arbitrary consumer-defined metadata, ignored by the engine. |
| `x-*` | any | | [Extension properties](#extension-properties). |

No other properties are permitted on a rule.

`resolved` deserves a note. By default a rule runs against the document *after* `$ref`s have
been resolved, which is what you want when asserting on the effective shape of an API. Set
`resolved: false` when the rule is about references themselves — their form, their targets,
whether they are used at all — because in the resolved document those references no longer
exist.

### `given` and path expressions

`given` selects the nodes a rule runs against. It is either a single path expression or a
non-empty array of them.

A **path expression** is a string that is one of:

- a **JSONPath expression**, beginning with `$` — for example `$.paths[*]` or
  `$..parameters[?(@.in === 'header')].name`;
- an **alias reference**, beginning with `#` and naming an [alias](#aliases), optionally
  followed by a JSONPath subset — for example `#Info.description`.

Anything else is invalid. A bare property name such as `paths` is a common authoring mistake
and is rejected by the schema.

```yaml
given:
  - $.info
  - "#OperationObject"
```

### `then` and functions

`then` is one function invocation, or an array of them all applied to every node `given`
matched.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `function` | `string` | ✔ | Name of a core function or of a [custom function](#custom-functions). |
| `field` | `string` | | Narrow the assertion to one property of the matched node rather than the node itself. The special value `@key` targets the node's own key. |
| `functionOptions` | `object` | | Options passed to the function. Its accepted shape is defined by the function. |

The reference implementation ships these core functions:

| Function | Asserts that the target… |
| --- | --- |
| `truthy` | is present and not `false`, `""`, `0`, `null`, or `undefined`. |
| `falsy` | is absent or falsy. |
| `defined` | is present. |
| `undefined` | is absent. |
| `pattern` | matches (`match`) and/or does not match (`notMatch`) a regular expression. |
| `casing` | uses a given casing convention (`flat`, `camel`, `pascal`, `kebab`, `cobol`, `snake`, `macro`). |
| `length` | has a `min`/`max` length, or numeric value within bounds. |
| `alphabetical` | is sorted, optionally `keyedBy` a property. |
| `enumeration` | is one of a set of `values`. |
| `schema` | conforms to a supplied JSON Schema. |
| `xor` | has exactly one of a set of `properties`. |
| `or` | has at least one of a set of `properties`. |
| `unreferencedReusableObject` | (as a reusable-object container) has no unreferenced members. |

```yaml
then:
  - field: summary
    function: truthy
  - field: summary
    function: length
    functionOptions:
      max: 120
```

### `severity`

How a rule's results are reported, and whether the rule runs at all.

| Name | Numeric |
| --- | --- |
| `error` | `0` |
| `warn` | `1` |
| `info` | `2` |
| `hint` | `3` |
| `off` | `-1` |

Both spellings are accepted wherever a severity is expected. When a rule omits `severity`, it
defaults to `warn`.

### `formats`

A **format** is a predicate that decides whether a given document is of a particular kind.
Scoping a rule to a format means the rule only runs against matching documents — so one
ruleset can govern an OpenAPI 3.1 description and an AsyncAPI 2.6 description without either
set of rules firing on the wrong one.

`formats` is an array of format identifiers. The reference implementation registers:

| Family | Identifiers |
| --- | --- |
| OpenAPI | `oas2`, `oas3`, `oas3_0`, `oas3_1` |
| AsyncAPI | `asyncapi2`, `aas2`, `aas2_0`–`aas2_6`, `aas3`, `aas3_0` |
| Arazzo | `arazzo1_0` |
| JSON Schema | `jsonSchema`, `jsonSchemaLoose`, `jsonSchemaDraft4`, `jsonSchemaDraft6`, `jsonSchemaDraft7`, `jsonSchemaDraft2019_09`, `jsonSchemaDraft2020_12` |

The schema lists these as known values for editor completion but accepts any string, so
rulesets targeting formats added later — or registered by a host application — remain valid.

A rule's `formats` overrides the ruleset's. Omitting both means the rule runs against every
document.

### `message`

Overrides the message reported for a result. Five placeholders are substituted:

| Placeholder | Resolves to |
| --- | --- |
| `{{error}}` | The message the function produced. |
| `{{description}}` | The rule's `description`. |
| `{{path}}` | The full path to the offending value. |
| `{{property}}` | The key or index of the offending value. |
| `{{value}}` | The offending value itself. |

```yaml
message: "{{description}} — `{{property}}` was {{value}}"
```

### Rule shorthands

Inside `rules`, a value that is not an object adjusts a rule inherited through
[`extends`](#extends) rather than defining a new one:

- a **severity name** (`error`, `warn`, `info`, `hint`, `off`) re-severities the rule;
- `false` disables the rule;
- `true` enables it at its declared severity.

```yaml
extends: spectral:oas
rules:
  operation-tags: error       # raise it
  info-contact: false         # switch it off
  oas3-schema: true           # switch it back on
```

Note that the numeric severities are **not** accepted in this position; only the names are.

---

## `extends`

Inherit from one or more other rulesets. An entry is a built-in identifier
(`spectral:oas`, `spectral:asyncapi`, `spectral:arazzo`), a file path, an npm module
specifier, or a URL.

```yaml
extends: spectral:oas
```

An entry may instead be a two-element tuple pairing a ruleset with the set of its rules to
enable:

| Mode | Enables |
| --- | --- |
| `recommended` | Only rules with `recommended: true`. The default when a bare string is used. |
| `all` | Every rule in the ruleset. |
| `off` | No rules — inherit the definitions without turning any of them on, then enable the ones you want by name. |

```yaml
extends:
  - [spectral:oas, all]
  - [./team-baseline.yaml, off]
  - https://example.com/rulesets/security.yaml
```

`off` is the mode that makes a large inherited ruleset adoptable: take the definitions, start
from silence, and switch rules on deliberately.

---

## `aliases`

Complex JSONPath expressions repeated across rules are the main source of drift in a large
ruleset. An alias names one, and rules reference it from `given` with a leading `#`.

Alias names must match `^[A-Za-z][A-Za-z0-9_-]*$`.

A **simple alias** is an array of path expressions — note that it is always an array, never a
bare string:

```yaml
aliases:
  Info:
    - $..info
  InfoDescription:
    - "#Info.description"
  PathItemObject:
    - $.paths[*]
  OperationObject:
    - "#PathItemObject[get,put,post,delete,options,head,patch,trace]"
```

Aliases compose: `InfoDescription` and `OperationObject` above are defined in terms of other
aliases.

A **scoped alias** resolves to different expressions depending on the format of the document
being linted, which is how one rule can govern structurally different specs:

```yaml
aliases:
  ParameterObject:
    description: Every Parameter Object, wherever this spec version keeps them.
    targets:
      - formats: [oas2]
        given:
          - $.parameters[*]
      - formats: [oas3]
        given:
          - $.components.parameters[*]
```

Each target requires both `formats` and `given`, and `given` in a target is always an array.

Aliases may be declared at the root of the ruleset or within an [override](#overrides).

---

## `overrides`

Overrides apply adjustments to a subset of the documents being linted, matched by glob. They
are an ordered array — later matching entries win over earlier ones, and every override wins
over the base ruleset. The array must not be empty.

There are two forms, distinguished by whether the `files` globs carry a JSON Pointer fragment.

**File-scoped** — globs without a `#` fragment. May change `rules`, `extends`, `formats`,
`parserOptions`, and `aliases`, and must contain at least `extends` or `rules`:

```yaml
overrides:
  - files: ["legacy/**/*.yaml"]
    rules:
      acme-operation-summary: warn
  - files: ["v3/**/*.yaml"]
    formats: [oas3_1]
    extends: [[./strict.yaml, all]]
```

**Pointer-scoped** — every glob carries a `#` fragment naming a location inside the document.
May change **only** rule severities, and must contain `rules`:

```yaml
overrides:
  - files: ["api.yaml#/paths/~1legacy~1users"]
    rules:
      acme-operation-summary: "off"
```

This asymmetry is deliberate: a waiver aimed at one path in one file can silence a rule there,
but it cannot quietly redefine what the rule means.

---

## `parserOptions`

Severities for problems found while parsing the document, before any rule runs.

| Field | Description | Default |
| --- | --- | --- |
| `duplicateKeys` | Duplicate keys in the document. | `error` |
| `incompatibleValues` | YAML values that have no JSON representation. | `error` |

```yaml
parserOptions:
  duplicateKeys: error
  incompatibleValues: warn
```

---

## Custom functions

When the core functions cannot express an assertion, a serialized ruleset can name custom
functions to load:

```yaml
functions:
  - dictionary
functionsDir: ./my-functions   # optional; defaults to "functions"
rules:
  no-evil-words:
    message: "{{error}}"
    given:
      - $.info.title
      - $.info.description
    then:
      function: dictionary
```

Each name in `functions` resolves to `<functionsDir>/<name>.js`, relative to the ruleset file.

Two caveats worth stating plainly. First, custom functions are the point at which a ruleset
stops being portable data and starts being code — a ruleset that names them cannot be fully
understood, or safely consumed, from the ruleset document alone. Second, in the reference
implementation that code is **not** sandboxed; extending an untrusted remote ruleset that
carries functions is arbitrary code execution. Prefer the core functions where they suffice.

---

## Extension properties

Properties beginning with `x-` are permitted at the root of the ruleset and on any rule, and
are ignored by the engine. Use them to carry ownership, tickets, review dates, or anything
else your own tooling needs:

```yaml
x-owner: platform-team
rules:
  acme-operation-summary:
    x-jira: GOV-142
    given: $.paths[*][*]
    then:
      field: summary
      function: truthy
```

Rules additionally have an `extensions` object for the same purpose.

---

## Conformance notes

This specification documents the format as the reference implementation actually behaves,
including where that behavior is looser than a clean design would be. Three points where the
schema deliberately matches the implementation rather than tightening it:

1. **`then` accepts unknown properties.** A misspelled `functionOption` (singular) is not
   rejected; it is silently ignored, and the function runs with its defaults. The schema
   permits this so that valid rulesets are not rejected, but authors should treat any
   unrecognized key inside `then` as a bug.
2. **Format identifiers are open.** Any string is accepted, so a typo like `oas31` validates
   and simply matches no document — meaning the rule never fires. Rules that never fire look
   identical to rules that always pass. The known identifiers are listed in the schema for
   editor completion; check them.
3. **Rule shorthands are name-only.** `severity: 1` is valid inside a rule definition, but
   `my-rule: 1` inside `rules` is not — the shorthand position takes only the severity names
   and booleans. The asymmetry is inherited, not intended.
4. **There is no self-describing key.** The root permits only the properties above plus
   `x-*`, so a ruleset cannot point at its own schema with a `$schema` property the way most
   JSON formats can. Schema binding has to happen outside the document, as shown in
   [Using the schema](#using-the-schema). A format specified from the start would have
   reserved that key.

Two further limits on scope:

- The schema describes the **serialized (JSON/YAML)** form. Rulesets authored in JavaScript
  can inline function implementations and whole ruleset objects, which have no JSON
  representation and are therefore out of scope.
- `given` values are checked for **shape** — that they are JSONPath expressions or alias
  references — not parsed as JSONPath. A syntactically invalid JSONPath will pass the schema
  and fail at lint time.

---

## Versioning

The schema lives under `schema/v1/` and is versioned independently of the reference
implementation. Within `v1`, changes will be additive and backward-compatible: new optional
properties, newly registered format identifiers, clarified descriptions. Anything that would
reject a previously valid ruleset gets a new directory and a new `$id`.

---

## Provenance and license

The format described here originates in
[Spectral](https://github.com/stoplightio/spectral) by Stoplight, licensed Apache-2.0. This
specification and schema were derived from the reference implementation's own internal
validation meta-schemas — `ruleset.schema.json`, `rule.schema.json`, `shared.json`,
`json-extensions.json`, and `js-extensions.json` in `packages/core/src/ruleset/meta/` — and
from its guides, then re-expressed as a single self-contained JSON Schema draft 2020-12
document with the implementation's runtime hooks and validator-specific error-message
extensions removed.

The schema is verified against the real-world rulesets published across the API Commons,
which it accepts, and against a suite of malformed rulesets, which it rejects.

This repository is licensed [Apache-2.0](LICENSE).

Maintained by [API Commons](https://apicommons.org) — open, machine-readable API building
blocks.
