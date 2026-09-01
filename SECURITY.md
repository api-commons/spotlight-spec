# Security Policy

This repository holds a specification, a published JSON Schema, and the site that serves them. That
is a smaller attack surface than a linter, and a larger blast radius: an implementation ships a bug
to the people who upgrade, while a specification ships a bug to everyone who implements it.

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it privately, either way:

- [**GitHub private vulnerability reporting**](https://github.com/api-commons/spotlight-spec/security/advisories/new) — the "Report a vulnerability" button under the repository's **Security** tab. This is the preferred route: it gives us a private thread, a draft advisory and a CVE request in one place.
- **info@apicommons.org** — if you would rather not use GitHub, or the report concerns the maintainer.

Include what you have. A rough reproduction is worth more than a polished writeup that arrives a
week later.

## What you can expect

| | Commitment |
|---|---|
| Acknowledgement | Within **5 business days** |
| Initial assessment | Within **10 business days** of acknowledgement |
| Fix or a stated plan | Communicated with the assessment, with a timeline attached |
| Credit | In the release notes, unless you would rather stay anonymous |

**These windows are deliberately conservative, and they are set by what one maintainer can actually
meet.** A project founded on the argument that an unanswered report is a real failure does not get
to miss its own published SLA. If the project grows enough maintainers to tighten them, they will be
tightened here in a commit you can see.

If you have not heard anything within the acknowledgement window, escalate by opening a public issue
that says only that you sent a private report and got no reply — no details. That is a legitimate
thing to do and it will not be held against you.

## What counts as a vulnerability in a specification

"It is only a document" is not a reason to skip this. A format has its own vulnerability classes,
and they are the ones that reach every implementation at once:

- **Constructs that are unbounded by design.** A `pattern` constraint that admits catastrophic
  backtracking, a path expression whose evaluation is not bounded, a recursive structure with no
  stated depth limit. If the specification permits it, every conforming implementation inherits it.
- **Composition that fetches.** `extends` and `$ref` reach other documents, and the specification is
  what says whether that is permitted, from where, and what a conforming implementation does about
  a redirect, a cycle, or a document that arrives from somewhere unexpected. Underspecified
  composition is a security question, not a convenience question.
- **Custom functions.** The format admits code loaded from a ruleset. What the specification says
  about that boundary is a security property of every engine that implements it.
- **Text that permits an unsafe implementation.** If the wording is ambiguous enough that a
  reasonable implementer builds something unsafe, that is a defect here, not only there. Report it
  here even if you found it in someone's engine.
- **Integrity of the published schema.** See below.

If you are unsure whether something qualifies, report it. Deciding that is our job, not yours.

## The published schema is the sharp edge

The JSON Schema is served at a permanent identifier:

```
https://spec.spotlight-rules.com/schema/v1/spectral-ruleset.schema.json
```

Other people's documents `$ref` that URL, editors bind to it, and CI pipelines fetch it. **Anything
that changes the bytes at a published `$id` — a force-push, a rewritten history, a misrouted domain,
a compromised Pages deployment — breaks or silently alters validation for every downstream consumer,
with no version bump and no signal.** Treat a report about the integrity or availability of that URL
as in scope and urgent, including one that is about our hosting rather than about our content.

The versioning policy promises that a published version is immutable. That promise is only as good
as the controls under it, which is why [#6](https://github.com/api-commons/spotlight-spec/issues/6)
is a security issue and not housekeeping.

## Scope

**In scope:** the specification text, the JSON Schema in `schema/`, the site published from this
repository, and this repository's own workflows.

**Out of scope, with somewhere better to send it:**

| | |
|---|---|
| A bug in the reference implementation | [`spotlight-tools`](https://github.com/api-commons/spotlight-tools/security/policy) |
| A bug in another engine that implements this format | That engine's maintainers — and please tell us, because it may be our wording |
| A vulnerability in `stoplightio/spectral` not present in this format | [Upstream](https://github.com/stoplightio/spectral/security) |

If a report applies in more than one place, tell everyone it applies to. We will coordinate rather
than race.

## Coordinated disclosure

We ask for the normal courtesy: give us a chance to ship a fix before publishing. We will agree a
disclosure date with you rather than impose one, we will not ask you to stay quiet indefinitely, and
if we go silent or miss the dates above, you are free to publish. That last sentence is the point of
the whole policy.

## Supported versions

| Version | Supported |
|---|---|
| Schema `v1` | Yes — the current line. **Status: draft**, and the specification has not reached a formal version one |
| Anything else | Nothing else has been published |

Until there is a numbered specification release, "supported" means fixes land on `main` and, where
they affect the schema, follow the rules in [versioning](https://spec.spotlight-rules.com/versioning/).

## This repository's own posture

Private vulnerability reporting, secret scanning, push protection and Dependabot security updates
are enabled. Branch protection on `main` is tracked in
[#6](https://github.com/api-commons/spotlight-spec/issues/6).
