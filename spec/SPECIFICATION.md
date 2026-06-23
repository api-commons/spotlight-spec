# Spotlight Ruleset Specification

**Version:** 0.1.0 (draft)
**Status:** Working draft, derived from Stoplight Spectral's ruleset format.
**Schema:** [`../schema/spotlight-ruleset.schema.json`](../schema/spotlight-ruleset.schema.json) (JSON Schema draft-07)

A **ruleset** is a JSON or YAML document that declares a set of **rules** for
linting a structured (JSON/YAML) target document — typically an API description
such as OpenAPI, AsyncAPI, or Arazzo. This document specifies the shape of a
ruleset. The normative artifact is the JSON Schema; this prose explains it.

In this document the key words **MUST**, **MUST NOT**, **SHOULD**, and **MAY**
are to be interpreted per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 1. Ruleset object

The root of a ruleset is an object. It **MUST** contain at least one of
`rules`, `extends`, or `overrides`. Unknown properties are not allowed, with one
exception: properties beginning with `x-` are reserved for extensions and are
permitted anywhere extension properties are noted below.

| Property | Type | Notes |
| --- | --- | --- |
| `rules` | object | Map of rule name → [Rule](#3-rule-object). |
| `extends` | [Extends](#4-extends) | Parent ruleset(s) to inherit from. |
| `overrides` | array of [Override](#5-override) | Context-specific adjustments. |
| `formats` | [Formats](#6-formats) | Default formats for all rules in the ruleset. |
| `aliases` | object | Reusable `given` expressions — see [Aliases](#7-aliases). |
| `parserOptions` | object | Parser diagnostics severity — see [§8](#8-parseroptions). |
| `functions` | array of string | Names of custom functions available to rules. |
| `functionsDir` | string | Directory (relative to the ruleset) holding custom functions. |
| `description` | string | Human-readable description of the ruleset. |
| `documentationUrl` | string (URL) | Link to documentation for the ruleset. |
| `x-*` | any | Extension properties. |

> **Portable vs. code form.** `functions`/`functionsDir` and string-valued
> `extends` describe the **serialized** form of a ruleset — the one written to a
> `.yaml`/`.json` file. Implementations that author rulesets in JavaScript may
> instead pass function objects and imported ruleset objects directly; that
> in-memory form is out of scope for this specification, which describes what a
> ruleset looks like as data.

## 2. Severity

A severity expresses how serious a rule violation is. It is either a number or a
human-readable string:

| Number | String | Meaning |
| --- | --- | --- |
| `0` | `"error"` | Error. |
| `1` | `"warn"` | Warning. |
| `2` | `"info"` | Informational. |
| `3` | `"hint"` | Hint. |
| `-1` | `"off"` | Disabled. |

## 3. Rule object

A rule is keyed by name within `rules`. A rule value is **either**:

- an **object** — a full rule definition (described below); or
- a **boolean** — `true`/`false` to enable/disable an inherited rule; or
- a **severity string** (`"error"`, `"warn"`, `"info"`, `"hint"`, `"off"`) — to
  change the severity of an inherited rule.

A full rule **object** **MUST** contain `given` and `then`. Allowed properties:

| Property | Type | Required | Notes |
| --- | --- | --- | --- |
| `given` | [Path expression](#31-given-path-expressions) or array thereof | yes | What nodes the rule targets. |
| `then` | [Then](#32-then) or array of Then | yes | The function(s) to apply. |
| `severity` | [Severity](#2-severity) | no | Defaults to `warn` if omitted. |
| `description` | string | no | What the rule checks. |
| `message` | string | no | Custom message; supports `{{property}}`, `{{error}}`, `{{value}}`, `{{path}}` placeholders. |
| `formats` | [Formats](#6-formats) | no | Restrict the rule to specific document formats. |
| `recommended` | boolean | no | Whether the rule is on when extended via the `recommended` modifier. |
| `resolved` | boolean | no | Run against the `$ref`-resolved document (`true`) or the raw document (`false`). |
| `tags` | array of string | no | Free-form grouping tags. |
| `type` | `"style"` \| `"validation"` | no | Classification of the rule. |
| `documentationUrl` | string (URL) | no | Link to docs for this rule. |
| `extensions` | object | no | Implementation-defined extension data. |
| `x-*` | any | no | Extension properties. |

### 3.1 `given` (path expressions)

`given` selects the nodes a rule applies to. It is a single **path expression**
or a non-empty array of them. A path expression is a string that is **either**:

- a **JSON Path** expression beginning with `$` (e.g. `$.paths[*]`,
  `$..parameters[?(@.in == 'query')]`); or
- an **alias reference** beginning with `#` (e.g. `#Operation`) — see
  [Aliases](#7-aliases). An alias reference MAY be followed by a JSON Path
  subset.

Anything else is invalid.

### 3.2 `then`

`then` describes the function to run against each targeted node. It is a single
**Then** object or an array of them (applied in order). A Then object:

| Property | Type | Required | Notes |
| --- | --- | --- | --- |
| `function` | string | yes | Name of the function to invoke (`truthy`, `falsy`, `pattern`, `enumeration`, `length`, `casing`, `alphabetical`, `schema`, `defined`, `undefined`, `xor`, `unreferencedReusableObject`, or a custom function name). |
| `field` | string | no | Apply the function to this child field of the targeted node, rather than the node itself. |
| `functionOptions` | object | no | Options passed to the function. |

> The schema validates the presence and type of `function`; the set of valid
> `functionOptions` is function-specific and not constrained here.

## 4. Extends

`extends` inherits rules from one or more parent rulesets. It is:

- a single string (a ruleset reference: a path, URL, or known ruleset id); or
- an array, each element being **either** a string, **or** a two-element
  `[reference, modifier]` pair where `modifier` is one of `"all"`,
  `"recommended"`, or `"off"`.

The modifier controls which of the parent's rules are enabled:

- `"recommended"` — only rules with `recommended: true`.
- `"all"` — every rule.
- `"off"` — none (inherit definitions without enabling them).

```yaml
extends:
  - [spotlight:oas, recommended]   # only recommended OAS rules
  - [./local-ruleset.yaml, all]    # everything from a local ruleset
```

> A flat array such as `[a, b]` means "extend two rulesets `a` and `b`". To pass
> a modifier, nest the pair: `[[a, recommended]]`.

## 5. Override

`overrides` is a non-empty array. Each entry adjusts the ruleset for documents
(or document locations) matching its `files` globs. There are two forms,
distinguished by whether the glob contains a `#` JSON Pointer:

**File override** (no `#` in the glob) — MAY set `rules`, `formats`, `extends`,
`parserOptions`, and `aliases`, and **MUST** include at least one of `extends`
or `rules`:

```yaml
overrides:
  - files: ["legacy/**/*.yaml"]
    rules:
      operation-needs-summary: off
```

**JSON Pointer override** (glob contains `#`) — MAY only adjust `rules` (to
severities), because a specific node is being targeted:

```yaml
overrides:
  - files: ["api.yaml#/paths/~1health"]
    rules:
      operation-needs-summary: hint
```

## 6. Formats

`formats` is an array of format identifiers restricting where a ruleset, rule,
or alias target applies. Common identifiers include `oas2`, `oas3`, `oas3_0`,
`oas3_1`, `asyncapi2`, `asyncapi3`, and `arazzo1_0`. The schema validates that
`formats` is an array of strings; the recognized set is implementation-defined.

## 7. Aliases

`aliases` defines reusable `given` expressions referenced from rules with a
`#Name` token. An alias name **MUST** match `^[A-Za-z][A-Za-z0-9_-]*$`. An alias
value is **either**:

- a bare `given` (a path expression or non-empty array thereof); or
- an object with `targets` — a non-empty array of `{ formats, given }` pairs,
  letting one alias resolve differently per format. An optional `description`
  MAY be provided.

```yaml
aliases:
  PathItem:
    - $.paths[*]
  Operation:
    description: All operations, per format.
    targets:
      - formats: [oas3, oas3_1]
        given: [$.paths[*][get,put,post,delete,patch]]
```

## 8. parserOptions

`parserOptions` sets the severity of parser-level diagnostics:

| Property | Type | Notes |
| --- | --- | --- |
| `duplicateKeys` | [Severity](#2-severity) | Duplicate keys in the source document. |
| `incompatibleValues` | [Severity](#2-severity) | Values incompatible with the detected type. |

## 9. Conformance

A document conforms to this specification if and only if it validates against
[`schema/spotlight-ruleset.schema.json`](../schema/spotlight-ruleset.schema.json)
under a JSON Schema draft-07 validator. The `errorMessage` keyword present in
the schema is an [ajv-errors](https://github.com/ajv-validator/ajv-errors)
annotation that customizes validation messages; validators without that plugin
**MUST** ignore it, as required for unknown keywords.
