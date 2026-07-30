---
layout: default
nav: contribute
title: Contribute
description: >-
  How to help turn the Spectral ruleset format into a formal specification — standards drafting,
  conformance cases, implementer review, and dependent organizations making themselves visible.
permalink: /contribute/
---

# Contribute

Four kinds of help, in rough order of how much they would change what gets built.

---

## 1. Standards drafting

**This is the gap.** Writing a good description and drafting a specification are different skills,
and the second one is a profession. Normative wording, conformance clauses, versioning policy, the
structure that lets an independent implementation point at a document and know what it owes —
that is routine work inside a standards organization and rare inside a software project.

If you do this for a living, [the roadmap](/roadmap/) is the list, and a first draft to shoot at is
worth more than a discussion about whether it should exist.

---

## 2. Conformance cases

**A ruleset that broke a tool** is the single most valuable artifact anyone can contribute right
now. Not a minimal reproduction — those already pass everywhere and prove nothing. The gnarly
production ruleset that behaved one way in one engine and another way somewhere else is exactly
the case a conformance suite needs, and exactly the case nobody has collected.

[What the suite needs to be](/conformance/).

---

## 3. Implementer review

If you maintain an engine that runs Spectral rulesets, two things:

- **Tell us what you would need** to run against a conformance suite and have the results
  published — including what would make that feel like a fair test rather than a trap.
- **Every proposed format change gets a public comment window before it lands**, with implementers
  notified directly. No format change should ever surprise an implementer. If you want to be on
  that list, say so.

This includes [vacuum]({{ site.vacuum }}), which is a supported and valued implementation, not a
competitor to be measured against.

---

## 4. Say that you depend on this

If your organization writes governance rules in this format — publicly, or inside a platform
nobody outside your company can see — **saying so is useful even if you contribute nothing else.**

Every conversation about a permanent home for this format comes down to the same question: who
actually uses it? That question has never had a public answer, because this format's users are
structurally invisible. They are governments with mandated rules, enterprises running the engine
behind an internal facade, and teams who wired it into CI two years ago and have not thought about
it since.

A visible list of dependents is worth more than any argument about why this deserves to be a
standard.

[Say so in the discussion]({{ site.discussion }}), or
<!--email_off-->[email directly](mailto:{{ site.email }}?subject=Spotlight%20Spec)<!--email_on-->
if you would rather be counted privately. Nothing is attributed without your say-so.

---

## Where things go

| What | Where |
|---|---|
| **Problems with the format, the schema, or this specification** | [spotlight-spec issues]({{ site.issues }}) |
| **Problems with the linter or engine** | [spotlight-tools issues]({{ site.repo_tools }}/issues) |
| **Direction, governance, naming, where this should live** | [the discussion thread]({{ site.discussion }}) |

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.issues }}">Open issues →</a>
  <a class="btn btn-outline-primary ms-2" href="{{ site.site_main }}">Back to Spotlight</a>
</p>
