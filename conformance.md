---
layout: default
nav: conformance
title: Conformance
description: >-
  What conformance to the ruleset format should mean, and the public test suite that would make
  compatibility claims falsifiable.
permalink: /conformance/
---

# Conformance

**Status: not written yet.** This page describes what needs to exist and why. It is the largest
single gap between the current draft and a real specification.

---

## The problem, stated precisely

There is more than one engine that runs Spectral rulesets. There is no way to settle a
disagreement between them.

Every party who has attempted compatibility reports the same finding: a trivial document with a
basic ruleset passes anywhere, and the gnarly production rulesets are where implementations come
apart. At least one implementation claiming full compatibility does not actually have it — and that
claim **cannot be adjudicated**, because there is nothing to adjudicate it against.

That is not a defect in any one tool. It is a missing artifact in the ecosystem, and it is the
predictable consequence of a format whose only definition was a linter's source code.

---

## What a conformance section has to define

- **Conformance classes.** At minimum: what a conforming *validator* must do, and what makes a
  *ruleset* conforming. These are different audiences with different obligations.
- **Required versus permitted variation.** Not everything needs to be identical. Diagnostic message
  wording, ordering of results, and performance characteristics are reasonable places for engines to
  differ. What must not differ is *which* rules fire, on *which* nodes, at *what* severity.
- **How an implementation declares conformance.** A claim nobody can check is marketing. A claim
  tied to a published suite and a version number is a fact.

---

## The test suite

The suite belongs with the specification, not with the reference implementation. The moment it
lives inside an engine, it measures that engine instead of defining the format.

**Design constraints:**

- **Data, not code.** Input document + ruleset + expected diagnostics, expressed so that a Go, Rust,
  Python, or JavaScript implementation can consume it without reimplementing a test harness.
- **Split into MUST and SHOULD.** A conforming implementation passes all of the first. Documented,
  declared divergence on the second is acceptable — undeclared divergence is not.
- **Cases contributed by users, from real rulesets.** A suite written by the specification author
  tests the specification author's assumptions. The valuable cases are the ones that already broke
  something in production.
- **Published results for every implementation** — every engine, every version, pass rate, and which
  cases fail. Including the reference implementation, **especially** where it fails.

---

## No blessed implementation

Worth stating plainly, because it shapes how the suite gets written: this exists so that **no single
implementation is the definition of correct.**

The reference implementation is one conforming engine among several. It is expected to fail cases
too, and those failures are bugs in it — not amendments to the suite.

That has a hard consequence for method. **Cases must be derived from the specification text, not
captured from any engine's output.** Capturing output from an implementation and calling it a
conformance suite just re-encodes that implementation's bugs as the standard, which is precisely the
situation this format is in today. Where the specification is currently too vague to write a case
from, that is a defect to raise against the specification — not a licence to go and read the code.

Tracked as [issue #9]({{ site.repo }}/issues/9).

## Every conformance class must be reachable in a browser

Real users run linting **in the browser** — in editors and playgrounds, in web-based governance
portals, in public-sector tooling that is deliberately client-side so documents never leave the
user's machine, and in environments where installing a binary is not permitted. At least one
national government programme is in exactly that position.

So runtime portability is not a nice-to-have that gets traded against throughput; it is a
**constraint on the specification itself**. Nothing in the normative text may require a filesystem,
a native process, or environment access — ruleset resolution, `extends`, and `$ref` all have to be
expressible over an abstract resolver that a browser implementation can satisfy with fetch or an
in-memory map. If any part of the format turns out to be genuinely unreachable in a constrained
runtime, it belongs in an optional, declared feature set rather than in the core.

The test of this is not an assertion in a document. It is that **a browser-only implementation can
pass a full conformance class**. Tracked as [issue #11]({{ site.repo }}/issues/11).

## A badge, once — and only once — the suite exists

An implementation that passes the suite should be able to display a badge stating which version of
the specification it conforms to, and at which class, **issued by whoever governs the specification**
rather than self-declared. That is what turns "compatible with the ruleset format" from a marketing
claim into a checkable one, and it is how implementers doing quiet parity work finally get credit
for it.

The design questions are real — what the badge asserts, who runs the suite, how renewal works when
the specification versions, whether partial conformance can be declared honestly, where the registry
lives, and who adjudicates a dispute. A badge is also a mark, which means whoever governs the
specification has to be able to defend it — one more way [where this lives](/where-it-lives/) is not
an abstract question.

What it is **not**: a certification business, a paid programme, or a gate on anyone's right to
implement the format. Anyone can implement this without asking, and anyone can ignore the badge.

Tracked as [issue #10]({{ site.repo }}/issues/10).

---

## This is a gift, not a weapon

[vacuum]({{ site.vacuum }}) is a supported and valued implementation. When its author rewrote the
engine in Go he explicitly refused to fork the format — he treated the format as the fixed point and
competed on the implementation, which was the right call and is the reason there is something worth
specifying here at all.

A conformance suite is what lets several engines coexist honestly instead of drifting apart quietly
and arguing about it in three years. Every known implementer should be invited to contribute cases
**before** any results table is published. Nobody should first encounter their own failing scores in
a blog post.

If the suite makes the reference implementation look bad in public, it is working.

---

## What would help most right now

**A ruleset that broke a tool.** That is the single most valuable contribution available to this
repository. Gnarly and production-real beats minimal and clean, because the minimal cases already
pass everywhere and prove nothing.

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.issues }}">Contribute a case →</a>
  <a class="btn btn-outline-primary ms-2" href="/roadmap/">Back to the roadmap</a>
</p>
