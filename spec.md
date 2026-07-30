---
layout: default
nav: spec
title: The Spec
description: >-
  The Spectral ruleset format as documented today — the ruleset object, rules, path expressions,
  functions, severity, formats, aliases, overrides, and extension properties.
permalink: /spec/
---

# The specification

**Status: draft.** The document below covers the whole format as implemented today, documented
faithfully and without extension. It is a complete description. It is not yet a formal
specification — it lacks normative wording and a conformance section, which is
[the roadmap](/roadmap/).

The document currently lives in the repository, and is the single source of truth. Publishing it
as a normative document on this site, section by section, is the first item of open work — and the
reason it has not simply been copied here is that a specification should not exist in two places
that can drift.

<p>
  <a class="btn btn-primary" href="{{ site.spec_doc }}">Read the full document</a>
  <a class="btn btn-outline-secondary ms-2" href="/schema/">The JSON Schema</a>
</p>

---

## What it covers

| Section | What it defines |
|---|---|
| [Using the schema]({{ site.spec_doc }}#using-the-schema) | Binding the schema in an editor and in CI |
| [The Ruleset Object]({{ site.spec_doc }}#the-ruleset-object) | The root object, its fields, and the rule that a ruleset must contribute something |
| [Rules]({{ site.spec_doc }}#rules) | The rule object, and what a rule name identifies |
| [`given` and path expressions]({{ site.spec_doc }}#given-and-path-expressions) | How a rule selects the nodes it applies to |
| [`then` and functions]({{ site.spec_doc }}#then-and-functions) | What runs against a selected node, and how functions are invoked |
| [`severity`]({{ site.spec_doc }}#severity) | The severity values and how `off` behaves |
| [`formats`]({{ site.spec_doc }}#formats) | Restricting rules to document formats |
| [`message`]({{ site.spec_doc }}#message) | Message templating and the available placeholders |
| [Rule shorthands]({{ site.spec_doc }}#rule-shorthands) | The compact forms a rule may take |
| [`extends`]({{ site.spec_doc }}#extends) | Inheriting from other rulesets, and the tuple form |
| [`aliases`]({{ site.spec_doc }}#aliases) | Named, reusable path expressions and scoped aliases |
| [`overrides`]({{ site.spec_doc }}#overrides) | Per-file and per-location adjustment |
| [`parserOptions`]({{ site.spec_doc }}#parseroptions) | Severities for problems in the document itself |
| [Custom functions]({{ site.spec_doc }}#custom-functions) | Loading and invoking your own functions |
| [Extension properties]({{ site.spec_doc }}#extension-properties) | The `x-` escape hatch |
| [Conformance notes]({{ site.spec_doc }}#conformance-notes) | Known implementation-defined behavior — the seed of a real conformance section |
| [Versioning]({{ site.spec_doc }}#versioning) | How the schema is versioned today |
| [Provenance and license]({{ site.spec_doc }}#provenance-and-license) | Where this came from, and under what terms |

---

## What is deliberately not in it

**No extensions.** The document describes the format as it exists, not as it might be improved.
Divergence from the format people already use would defeat the purpose — your existing rulesets are
the thing being protected here.

**No opinions about the linter.** How an engine resolves references, caches, or reports results is
implementation detail. Where the current text does record implementation-defined behavior, it does
so explicitly in [Conformance notes]({{ site.spec_doc }}#conformance-notes), which is where the
formal conformance section will grow from.

---

## How to argue with it

The most useful contribution is not a wording suggestion — it is a **ruleset that behaves
differently than this document says it should**. That is a bug in the specification, and the file
itself is the bug report.

Where the specification and the reference implementation disagree today, **the implementation is
right by definition** and the document has to be corrected. This document was reverse engineered
from that implementation's internals, so those disagreements exist and finding them is the work.

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.issues }}">Open an issue →</a>
  <a class="btn btn-outline-primary ms-2" href="/contribute/">Other ways to help</a>
</p>
