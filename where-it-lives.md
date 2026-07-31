---
layout: default
nav: home-for-the-spec
title: Where it lives
description: >-
  The candidate homes for this specification, the technical-versus-fiscal distinction that decides
  more than the choice of foundation does, and the research behind both.
permalink: /where-it-lives/
---

# Where this specification lives

**Today: the [API Commons](https://github.com/api-commons) GitHub organization. Deliberately a
parking spot, not a destination.**

API Commons is not a home for technology and it is not a funding mechanism. It is an information,
story and research-sharing venue, and somewhere neutral for a project to stand while its permanent
home is worked out. Nobody driving this wants to own the format. That is not modesty — a
specification whose permanent answer to "where does it live" is "in one person's organization" has
not actually solved the problem it was created to solve.

[Where it goes is an open issue]({{ site.repo }}/issues/8). This page is the argument, so the issue
can be about the decision.

---

## This is about the specification, not the tooling

The two questions have different answers and conflating them is how this discussion goes wrong.

The entire premise of separating the format from the linter is that **the format can be governed in
one place and implemented in many**. A home that can only accept both together, or that requires
splitting them permanently apart, is a home that has misunderstood the problem. Where the reference
implementation lives is a separate decision, made later, on its own merits.

## The candidates

### An existing API specification organization

**For.** Proximity to the specifications this format is most often used against. The citation
culture already exists — the people who need to cite this format are, in many cases, already citing
the neighbours. Less bureaucracy to admit a specification than to charter a new project.

**Against.** At least one obvious candidate's charter has historically constrained tooling, which is
awkward when the point is keeping a specification and its reference implementation deliberately
aligned. Whether that still binds, and whether a spec-only entry sidesteps it entirely, is a
question of fact that should be established rather than assumed.

**The honest worry.** A specification that arrives somewhere with no coalition, no conformance
suite, and one maintainer arrives as an orphan with better paperwork. Being accepted is not the
same as being sustained.

### A broader software foundation

**For.** Neutral, understood by enterprise legal departments, credible in procurement — which
matters more than it sounds when your users are governments.

**Against.** Onboarding is slow, and the value has to be actively extracted rather than delivered.

### An independent fiscal host, with the technical project elsewhere

The option most people do not know exists, and the one that changes the funding picture completely.
See below.

### A European home

**For.** The most advanced adoption of machine-readable API design rules is in European
public-sector programmes, several of which mandate them. A home closer to those users is closer to
both the mandate and the money.

**Against.** Risks reading as regional, which is the opposite of what a specification wants.

### Stay put

**For.** Zero overhead, full agility, nothing blocked, and the option to move later stays open.

**Against.** Does not fix the bus factor, and does not stop the sentence this effort exists to stop
having to say.

---

## The distinction that decides more than the choice of foundation

Some foundation projects are **technical and fiscal at once**: the project sits inside an entity
that also handles its money, and funding flows through that entity's membership model. Others
separate the two — the **technical project** in one place, and **fiscal hosting** (the ability to
receive earmarked sponsorship, pay maintainers, and account for it publicly) somewhere else.

That distinction matters here because of how this specification will realistically be funded.

It is depended on by organizations that will never buy a foundation membership to fund a linting
format, but that could plausibly sign off a few thousand a year for a dependency they already run
in production. Under a combined technical-and-fiscal project, **that ask does not exist as a
category** — sponsorship becomes a membership story, and the specification does not stand on its own
two feet. Under a split arrangement, the ask is direct and legible: *this money maintains this
specification*, and here is the public accounting for it.

At least one neighbouring API specification already operates exactly this way. The mechanics of the
fiscal-host side are unexciting in the best way: a transparent percentage-based administrative fee
taken from sponsorship, straightforward recurring payments for sponsors, public accounting, and —
where a project is being separated out of a former corporate owner — legal support for the
separation itself.

**So the question is not "which foundation."** It is: *which technical home, which fiscal
arrangement, and are they allowed to be different?* Every candidate should be evaluated on both
axes.

---

## The umbrella question

There is a larger question worth asking while this one is open: **should API specifications sit
together at all?**

Today OpenAPI, AsyncAPI, JSON Schema, GraphQL and the rest are each governed separately, in
different organizations, with different funding models and largely non-overlapping governance
bodies — despite being used together, by the same people, in the same pipelines, on the same
documents. There is a plausible argument that a shared API standards project would give all of them
more visibility, more budget, and a shared answer to problems each is currently solving alone. There
is an equally plausible argument that consolidation is how specifications lose the independence
that made them credible.

This specification is too small to settle that. But it is small enough to be a useful test case,
and the conversation is worth having in the open rather than in the corridor.

---

## The research this rests on

[Governance](/governance/) already reads how OpenAPI, AsyncAPI and JSON Schema govern themselves,
from their primary documents. That work is being extended along a second axis — **funding** — with
the same method: for every API specification in a foundation today, what does it own, where are its
boundaries, which group is it in, what is its governance model, and what is its funding model.

The finding that motivated the extension is simple. These groups overlap almost completely in users
and almost not at all in structure, and none of them can currently answer *who pays to maintain
this* in a way the others could learn from.

**Corrections to that research are more useful than agreement with it.** It is being done from
public documents by one person, which is exactly the kind of work that benefits from being wrong in
public early.

---

## What this specification has to arrive with

Whichever home wins, the specification should not turn up empty. Four things make it worth
accepting, and each is tracked in the open:

- **A conformance suite** — [issue #9]({{ site.repo }}/issues/9)
- **More than one maintainer** — [issue #3]({{ site.repo }}/issues/3)
- **A versioning policy** — [/versioning/](/versioning/)
- **A named set of organizations that depend on it** — [issue #15]({{ site.repo }}/issues/15)

That last one is the hardest and the most valuable. Every conversation about a permanent home ends
at *who actually uses this?*, and the answer has never been public. It is being gathered by asking
people rather than by instrumenting them: a public dependents register, a private channel that
counts the same, and observable evidence from public sources. One national government programme has
already agreed to be named. Everyone else is asked first.

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.repo }}/issues/8">Argue about the home →</a>
  <a class="btn btn-outline-primary ms-2" href="{{ site.site_main }}/funding/">The funding argument</a>
</p>
