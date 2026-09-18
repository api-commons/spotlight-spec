# Conformance suite — a proposal to argue with

**Status: proposal. Nothing here is agreed.** This directory exists so that the conformance
discussion in [#9](https://github.com/api-commons/spotlight-spec/issues/9) has a concrete
artifact to be about, rather than another round of agreement that a suite would be good.

It is twelve MUST cases and one MAY case. That is not a conformance suite — #9 rightly asks
for several hundred. It is the smallest thing that answers the questions a suite has to answer
before anyone writes several hundred of anything:

- What does one case look like?
- What does an implementation have to supply in order to run them?
- What counts as a match?
- **What happens when you try to write a case and the specification does not tell you the
  answer?**

That last one turned out to be the valuable part. See [GAPS.md](GAPS.md).

---

## The one rule that shapes everything else

**Cases are derived from the specification text. Never captured from an engine's output.**

Capturing what an implementation does and calling it a conformance suite re-encodes that
implementation's bugs as the standard. Every case in `cases/` quotes the sentence of the
specification it tests, in its own `rationale` field, and any case that cannot quote one does
not belong here — it belongs in [GAPS.md](GAPS.md) as a question for the specification.

This applies to the reference implementation too. **It is expected to fail cases.** Those
failures are bugs in it, not amendments to the suite.

---

## Case format

One case per file, data only, so that an engine in any language can consume it without
reimplementing a test harness.

```yaml
id: severity/default-is-warn      # stable, unique, path-shaped
tier: MUST                        # MUST | MAY
class: validator                  # validator (default) | ruleset
spec: "#severity"                 # anchor into the specification
title: One sentence, in the indicative.
rationale: >-
  Why this case exists, quoting the specification. Where an engine could plausibly
  diverge, say how.
requires: [remote-resolution]     # optional; named capabilities the case needs
ruleset: { ... }                  # the ruleset under test, inline
document: { ... }                 # the document to lint, inline
fixtures: { ... }                 # optional; files or URLs the case needs resolvable
expect:
  diagnostics: [ ... ]            # for class: validator
  ruleset: invalid                # for class: ruleset
```

**Everything is inline.** No case reads a neighbouring file. A case is one document, and a
runner in any language can load it with a YAML parser and nothing else.

### Two conformance classes

The specification has two audiences with different obligations, so the suite has two kinds of
case:

| `class` | Asserts | Answers the question |
|---|---|---|
| `validator` | Given this ruleset and this document, these diagnostics | Does this engine behave correctly? |
| `ruleset` | This ruleset is valid, or is not | Do engines agree on what a ruleset even is? |

The second class matters more than it looks. An engine that accepts a ruleset others reject is
not being generous — it is letting an author ship something that will fail in a colleague's
pipeline.

---

## What counts as a match

Underspecify this and every implementer draws a different line, which is the failure the suite
is supposed to prevent. So, explicitly:

**Compared:**

| | |
|---|---|
| `code` | The rule name that produced the diagnostic |
| `severity` | Compared as a **name**, after normalizing the numeric spellings |
| `path` | An array of property names and array indices, from the document root |

**Not compared:**

- **Message wording.** Engines phrase things differently and should be free to. A case that
  depends on message text is testing English, not conformance.
- **Ordering.** The expected list is an unordered multiset. Two diagnostics identical in all
  three compared fields are two diagnostics, and both must be present.
- **Line and column.** Position is a property of the source text, not of the format. A case
  needing it would have to pin the exact serialization, which no case here does.

**Extra diagnostics fail the case.** `expect.diagnostics: []` means silence, not "no more than
expected" — over-reporting is a conformance failure in the same way under-reporting is, and it
is the more common one.

---

## Runner contract

An implementation supplies **one function**. Everything else is the runner's problem.

```
lint(ruleset, document, fixtures) -> Diagnostic[] | RulesetInvalid
```

| Term | Meaning |
|---|---|
| `ruleset` | The parsed ruleset object, exactly as it appears in the case |
| `document` | The parsed document to lint, exactly as it appears in the case |
| `fixtures` | Any paths or URLs the case declares, pre-resolved to their contents |
| `Diagnostic` | `{ code, severity, path }`, with anything else ignored by the comparison |
| `RulesetInvalid` | Whatever the engine's idiomatic rejection is — an exception, an error value |

Deliberately **not** in the contract: how a document is parsed, how a ruleset is loaded from
disk, how results are formatted, and what the CLI looks like. All of those are the engine's
business and none of them are the format.

A runner reports, per case: **pass**, **fail** (with the diagnostic diff), or **skipped**
(with the `requires` capability that was not available). *Skipped is not pass.*

---

## Tiers

**MUST** — pass all of these to claim conformance. Twelve cases today.

**MAY** — a declared optional layer. One case today, and it will stay near-empty on purpose
until the working group decides what is genuinely optional. **Padding the MAY tier is how a
conformance suite becomes meaningless**: every awkward divergence gets quietly reclassified as
permitted variation, and the suite ends up certifying that everyone is different in an approved
way.

The current MAY case is `extends/from-a-url`, which needs network access an embedded or
air-gapped engine may reasonably refuse.

---

## Publishing results

`results/` holds one file per implementation per version — pass rate and the failing case ids,
produced the same way for every engine.

This is the point of the whole exercise. Today a compatibility claim is a statement nobody,
including the project making it, can check. Published results make it a fact with a date on it.
Any engine is welcome to run this and publish, and an engine that runs it and fails is in a
better position than one that has never been measured.

**Nothing is published here yet**, because there is nothing to publish until the case format
survives the working group.

---

## What this is not

- Not the several-hundred-case suite #9 describes. It is the shape to build that in.
- Not a claim that the twelve cases are the right twelve.
- **Not evidence about any implementation.** No engine has been run against this. Any table of
  results that appears before `results/` has files in it is a table somebody made up.

Discussion belongs in [#9](https://github.com/api-commons/spotlight-spec/issues/9).
