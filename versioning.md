---
layout: default
nav: versioning
title: Versioning
description: >-
  A proposed versioning strategy for the ruleset format — numbered versions, a stated stability
  line, and references that keep working.
permalink: /versioning/
---

# Versioning

**Status: proposed.** This page is a starting point to argue with, not a decided policy.

A specification's versioning policy is a promise about the future made to people who cannot
renegotiate it later. Governments cite formats in normative text. Enterprises encode them in
platforms nobody has touched in three years. Procurement processes put version numbers into
contracts. All of those readers need the same three things: a number they can name, a statement of
what that number guarantees, and a reference that still resolves in five years.

---

## Two version lines that must not be conflated

- The **specification** version — what a valid ruleset is.
- The **implementation** version — what one engine does. The reference implementation is currently
  on a `6.x` line inherited from upstream.

These deliberately do not track each other. A ruleset author cares about the first. A pipeline
maintainer cares about both. Every previous attempt to describe this format failed exactly here, by
letting the tool's version stand in for the format's — which is how the format ended up versioned
by a CLI's release cadence in the first place.

**A compatibility matrix is therefore a first-class artifact**, not a footnote: specification
version × implementation × implementation version. That is also where other engines appear, which
is the point.

---

## What the numbers would mean

| Change | Result |
|---|---|
| New optional property, newly registered format identifier, clarified prose | Additive within the current major. New dated revision, same major identity, changelog entry |
| Anything that would reject a ruleset that was previously valid | New major. New directory, new `$id`. The previous major keeps resolving **forever** |
| Correcting a place where the specification was wrong about the format as implemented | Additive if it *widens* what is accepted; breaking if it *narrows*, and narrowing requires an explicit deprecation period |

That last row will come up more than anyone expects, because this specification was reverse
engineered from a reference implementation's internals. Where the specification and the
implementation disagree today, **the implementation is right by definition** and the specification
has to be corrected. Each of those corrections is worth publishing as a finding, since undocumented
behavior is precisely what makes multi-engine compatibility unadjudicable.

---

## Stability, stated plainly

The distinction worth borrowing from mature specifications is between the *document* and the
*identity*.

- **The document is a draft.** Wording will change, sections will be added, and the conformance
  section does not exist yet.
- **The `v1` schema identity is not a draft.** Once published, a given version's URI resolves to
  the same bytes forever. Anything that would change meaning gets a new URI.

Conflating those two is how specifications lose the trust of the people who cite them. A draft you
can safely reference is a normal thing; a reference that silently changed underneath you is not.

**Proposed rules, all of them falsifiable:**

- Never invalidate a ruleset that was valid within a major version.
- Never move or repoint a published `$id`.
- Never unpublish a version.
- Never make the specification depend on any single implementation.
- Dated revisions within a major, alongside a stable major alias, so people can pin if they want to
  and most never think about it.

---

## Process, not just numbers

Numbers are the easy half. The half that actually protects implementers is process: every proposed
change to the format gets a public comment window before it lands, with known implementers notified
directly.

**No format change should ever surprise an implementer.** That single rule is most of what
separates a specification from a configuration file, and it costs nothing except the discipline to
wait.

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.issues }}">Argue with this →</a>
  <a class="btn btn-outline-primary ms-2" href="/roadmap/">Back to the roadmap</a>
</p>
