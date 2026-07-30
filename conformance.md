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
