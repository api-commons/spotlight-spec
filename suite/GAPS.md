# What writing twelve cases exposed

[#9](https://github.com/api-commons/spotlight-spec/issues/9) says it plainly:

> Where the specification is currently too vague to write a case from, that is a finding to
> raise against the specification, not a licence to look at what the code does.

Twelve cases produced **seven** such findings. That ratio is the most useful thing in this
directory. It is also an argument for writing cases *before* writing normative wording rather
than after: each gap below is a sentence the specification does not currently contain, found by
trying to depend on it.

None of these are answered here. Answering them is [#2](https://github.com/api-commons/spotlight-spec/issues/2).

---

## 1. There is no defined representation for a diagnostic's location

**Blocks: every validator case in the suite.**

The specification describes what a rule matches. It never says how an engine reports *where* a
finding is, in a form another engine could agree with. Is the path to `a` inside `items[0]`
the array `["items", 0, "a"]`, the string `$.items[0].a`, the string `items.0.a`, or a
JSON Pointer `/items/0/a`?

The suite currently invents an answer — an array of property names and indices — and documents
it in `README.md` under "What counts as a match". **That is a specification gap being papered
over by a test harness, which is exactly backwards.** A conformance suite should encode the
specification, not supply it.

This is the single highest-priority item here, because nothing else in the suite can be written
without taking a position on it.

## 2. `{{path}}` in a message has no defined string form

**Related to gap 1, and separately unresolvable.**

The `message` section says `{{path}}` resolves to "the full path to the offending value". As
what text? Every candidate in gap 1 is a plausible substitution, and users match on message
output in their pipelines.

No `message` case could be written. There are none in the suite for this reason.

## 3. `off` — is the rule not run, or run and suppressed?

The severity table places `off` under "whether the rule runs at all", which suggests not run.
The specification does not say so normatively, and the difference is observable in at least
three ways: a custom function with a side effect, the cost of an expensive rule in a large
ruleset, and whether an `overrides` block can re-enable a rule that the base ruleset turned
off.

The third is the one that will bite someone. It is also the one most likely to already differ
between engines.

## 4. An array `given` — is an overlapping match evaluated once or twice?

"`given` ... is either a single path expression or a non-empty array of them." If two
expressions in that array both match the same node, does the function run once against that
node or twice, and does the author see one diagnostic or two?

`given/array-selects-the-union` deliberately uses **disjoint** expressions and says so in its
own body, because the overlapping case cannot be derived from the text. Real rulesets overlap
constantly — `$..parameters[*]` alongside `$.paths[*][*].parameters[*]` is an ordinary thing to
write.

## 5. `extends` says nothing about conflict or order

The section describes what an entry may be and what the three modes enable. It does not say
what happens when **two parents define the same rule name**, whether **later entries win over
earlier ones**, or how a child's `severity` for an inherited rule interacts with the
`recommended`/`all`/`off` mode it arrived under.

Inheritance conflict is where large real rulesets live, and it is unspecified. No `extends`
case beyond the MAY one is in the suite.

## 6. Severity defaults for inherited rules are unstated

"When a rule omits `severity`, it defaults to `warn`" is clear for a rule defined in the
ruleset at hand. It does not say whether a rule inherited through `extends` keeps the parent's
severity or re-defaults, and `recommended: true` is a third input nobody has reconciled with
the other two.

`severity/default-is-warn` is therefore scoped to a locally defined rule only.

## 7. "Matches no document" is a silent outcome, and the specification knows it

Conformance note 2 already flags this: an unregistered format identifier means the rule never
fires, and "rules that never fire look identical to rules that always pass."

The note describes the hazard and stops. It does not say whether a conforming implementation
**may** warn about an unresolvable format identifier, **must** stay silent, or **must** warn.
All three are defensible; only one can be tested.

`formats/unknown-identifier-never-matches` asserts silence, because silence is what the note
describes. **If the working group decides an engine should be allowed to warn, that case is
wrong and should change** — which is the correct order of operations, and worth stating so the
case is not mistaken for a decision.

---

## The pattern underneath all seven

Six of the seven are about **composition and reporting**, not about what a rule does. The
single-rule, single-document happy path is well specified; every gap appears the moment rules
inherit, overlap, or have to say where they found something.

That matches what everyone who has attempted engine parity reports independently: the happy
paths pass everywhere, and real production rulesets are where implementations come apart. The
gaps are not evenly distributed, and neither should the normative-wording effort in
[#2](https://github.com/api-commons/spotlight-spec/issues/2) be.
