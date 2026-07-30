---
layout: default
nav: roadmap
title: Roadmap
description: >-
  What separates the current draft from a formal specification — normative wording, a conformance
  section, a versioning strategy, and a stable identity anyone can cite.
permalink: /roadmap/
---

# From a description to a specification

The document in this repository describes the Spectral ruleset format well. That is not the same
thing as a specification, and being clear about the difference is the point of this page.

A description tells you how something behaves. A specification tells an independent implementer
what they **must** do to be correct, gives them a way to prove it, and gives everyone else a
stable thing to cite. The gap between the two is not more prose — it is a specific set of
artifacts that standards organizations produce as a matter of routine and that software projects
almost never get around to.

This page is the list. All of it is open work.

---

## 1. Normative wording

The draft currently explains the format in the voice of documentation: *this is what happens when
you write `given` as an array*. A specification says *an implementation **MUST** treat an array
`given` as a set of independent path expressions, each evaluated against the resolved document*.

That change is not cosmetic. It converts every paragraph into something an implementer can be
measured against, and it exposes every place where the current text is ambiguous — which is
exactly where implementations quietly diverge today.

**What this involves:** adopting the usual keyword conventions and applying them consistently;
separating normative requirements from explanatory prose and examples; identifying the places
where the current description hides an assumption rather than states a rule.

---

## 2. A conformance section

Right now there is no definition of what it means to conform. That means **no compatibility claim
between any two engines can be adjudicated**, because there is nothing to adjudicate against.
Everyone who has attempted parity reports the same finding: the happy paths pass everywhere, and
production rulesets are where implementations come apart.

**What this involves:** defining conformance classes — at minimum, what a conforming *validator*
must do versus a conforming *ruleset* — stating which behaviors are required and which are
permitted variation, and specifying how an implementation declares its own conformance.

Paired with a public, machine-readable test suite, this is the single highest-leverage artifact
this repository can produce. [More on the plan](/conformance/).

---

## 3. A versioning strategy

Numbered versions, a clear line between what is stable and what can still move, and references
that keep working. The model to follow is the one the API specification world already understands
from [OpenAPI]({{ site.openapi }}) — because the people who need to cite this format are, in many
cases, the same people already citing that one.

This matters more here than in an ordinary software project, because the citers are not developers.
They are governments, standards bodies, and procurement processes putting a version number into a
document that will outlive everyone's interest in the project. [The proposal](/versioning/).

---

## 4. A stable identity, published on its own site

A specification needs a URI that is stable, controlled by the project, and safe to cite. Today the
schema identifies itself with a source-control URL pointing at a branch — mutable by definition, on
a hostname this project does not control.

This site is the first half of fixing that: the schema is now served from a project-controlled
domain alongside the specification that describes it. The second half is switching the schema's own
declared identity to match, which is a breaking change for anyone already referencing it and so has
to happen deliberately and early. [Where that stands](/schema/#the-canonical-uri).

---

## Why the order matters

These are listed roughly in dependency order. Normative wording is what makes a conformance section
possible, because you cannot test a requirement that was never stated as one. Conformance is what
makes versioning meaningful, because "backward compatible" is an empty phrase without a suite that
demonstrates it. And a stable identity is what makes the whole thing citable, which is the entire
point of the exercise.

None of it requires permission. All of it benefits from people who have done it before.

<p class="mt-4">
  <a class="btn btn-primary" href="/contribute/">How to help →</a>
  <a class="btn btn-outline-primary ms-2" href="{{ site.issues }}">Open issues</a>
</p>
