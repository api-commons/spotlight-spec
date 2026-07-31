---
layout: default
nav: governance
title: Governance
description: >-
  How OpenAPI, AsyncAPI and JSON Schema govern themselves, what is worth borrowing, and a
  deliberately small governance model for this specification.
permalink: /governance/
---

# Governance

**Status: proposed.** This is a starting point to argue with. Nothing here is ratified, and the
first job of anyone who joins is to disagree with it in public.

The uncomfortable fact this page exists to address: **this specification currently has one
maintainer.** That is the single largest risk to anything else on this site. A format that a
national government depends on should not have a bus factor of one, and no amount of good
drafting fixes that. Governance here is not paperwork — it is the mechanism for stopping being one
person.

---

## What the neighbours actually do

Rather than invent a model, it is worth reading how three specifications in this exact space
govern themselves. All three documents are public. All three are worth stealing from.

### OpenAPI Initiative

A Linux Foundation project. A Technical Steering Committee holds all merge authority — in their
words, *"all and only members of the TSC are maintainers."*

The numbers are the interesting part. The TSC has a **floor of 3** and a **cap of 9**: if
membership drops below three, *work is suspended* until the Business Governing Board re-establishes
the minimum. Getting in is deliberately slow — nomination by motion from a voting member, a
confidential vote where a nominee must not draw opposition from more than 25% of the membership, a
**six-month provisional period**, then a second confidential vote before voting rights attach. At
most four voting periods a year. Removal takes a 66% vote.

Decisions strive for unopposed consensus; unresolved conflicts escalate to a Technical Oversight
Board.

**Worth borrowing:** the floor and the cap. A stated minimum below which you admit work has stopped
is honest in a way most projects avoid, and a maximum keeps a decision-making body able to decide.

**Not worth borrowing yet:** a six-month provisional period is the process of an organization with
more candidates than seats. This one has more seats than candidates.

### AsyncAPI

Also Linux Foundation, and structurally the opposite. There is a ladder — Maintainer or Ambassador
→ Technical Steering Committee → Governance Board — and the striking part is how you climb it:

> Any maintainer and any ambassador can change their status by editing `isTSCMember` properties.

**TSC membership is self-service.** You edit a YAML file. Membership lives in `MAINTAINERS.yaml`
and `AMBASSADORS_MEMBERS.yaml` in a public repository, and the website renders the current roster
from those files. The Governance Board above it is elected — five members, 24-month staggered
terms, private ballot, first-past-the-post.

**Worth borrowing, heavily:** governance as data in the repository rather than prose about
governance. It is transparent by construction, diffable, reviewable through the normal pull request
process, and it costs nothing to operate. Also the recognition that **Ambassadors** — people who do
non-code work — sit on the same ladder as maintainers.

### JSON Schema

The most instructive of the three, because it is the closest analogue to this project and it is
candid about being unfinished. Its governance document opens with:

> 🚨 This document is not ratified 🚨

It also states plainly that the project *"has no legal entity nor is housed within an entity which
can take on business responsibilities,"* so the TSC absorbs those responsibilities as far as it can.
There is no employer cap today, but a rule is pre-committed: once the TSC reaches ten members, no
more than 50% — ideally a third — may share an employer.

The decision process is the part to steal. Two mechanisms, consensus and voting, with consensus the
default and an explicit **quick path** for small things: a member proposes, and if three other
members vote in favour with none against, the expedited process carries. Otherwise it falls back to
a staged standard process with labels tracking each stage, and every decision documented in an
issue. Their model is itself a derivative of another project's, credited openly.

**Worth borrowing:** a written, cheap default decision path, and the honesty of shipping a
governance document marked unratified rather than waiting until it is perfect. Also the pre-committed
employer cap — deciding the rule before it binds anyone is much easier than deciding it afterwards.

**The cautionary note:** JSON Schema is depended on by nearly everything and spent years without a
ratified governance model, partly because its standardization vehicle stalled. Widespread adoption
does not produce governance on its own. Somebody has to write it.

---

## What this specification proposes

Three principles, then the model.

**1. Governance is data, not prose.** A `MAINTAINERS.yaml` in the repository is the roster. Changes
go through pull requests like everything else. Nobody has to take minutes for the membership to be
public.

**2. Every rule is falsifiable.** The case against upstream was built on a number — issues closed
per year. It would be indefensible to run this project on unmeasurable promises. Response windows
and triage figures get published, including when they are bad.

**3. No process before there are people to run it.** A five-page charter with one signatory is
theatre. This grows in stages, and each stage is triggered by a fact rather than a date.

### Stage 0 — now, and honest about it

- **Roles.** *Maintainer* — merge rights on the specification and a vote. *Editor* — drafts
  normative text, need not be a maintainer. *Steward* — accountable when nobody else is, and the
  tie-break of last resort. Non-code contribution counts toward every one of these.
- **Decisions by lazy consensus.** Proposals sit in a public issue for a stated window. Silence is
  assent. Any maintainer can request the window be extended once.
- **Format changes are different.** Anything that changes what a valid ruleset is gets a longer
  comment window and direct notification to known implementers. **No format change surprises an
  implementer** — that single rule is most of what separates a specification from a config file.
- **Two-maintainer rule, as soon as there are two.** No spec-affecting change merges on one
  person's say-so.
- **Everything decided in public.** Not in DMs, not in a call I did not write up.

### Stage 1 — at three or more maintainers

- A **floor of 3 and a cap of 7**, borrowed from OAI and scaled down. Below the floor, say so
  publicly rather than pretending.
- **Employer diversity pre-committed** before it binds anyone: no more than half of maintainers
  sharing an employer, and the intent is a third.
- **Consensus first, vote second**, with a quick path for small decisions along JSON Schema's lines.
- A **public decision log** — short records in the repository, so decisions are greppable instead of
  buried in a thread.
- Maintainers added by proposal and lazy consensus of existing maintainers. **No six-month
  provisional period.** That is a rule for organizations turning people away.

### Stage 2 — a permanent home

Where this eventually lives is [genuinely open]({{ site.repo }}/issues/8), and the argument for each
candidate is laid out in [where it lives](/where-it-lives/). What Stage 2 looks like is mostly
determined by that answer, so writing it now would be guessing.

Three things can be committed to now. The choice gets **made in public**. **No home is accepted that
requires splitting the specification from its reference implementation** — that is the failure this
whole effort exists to correct. And the choice is evaluated on **two axes, not one**: the technical
home and the fiscal arrangement, because whether this specification can ever be sponsored directly —
rather than folded into somebody's membership story — depends on whether those two are allowed to be
different. [The funding argument]({{ site.site_main }}/funding/) is the long version.

---

## On co-maintainers

**Welcome, and actively wanted.** The bottleneck is not a shortage of process, it is a shortage of
people with the right to say no to me.

Two things asked of anyone taking that on. Be willing to **disagree in public**, because a
co-maintainer who ratifies is worse than no co-maintainer at all. And treat the **two-maintainer
rule** as binding from the day there are two, including against me.

Two things offered in return. **Real authority** — merge rights, a vote, and a say in what gets
drafted, not an advisory title. And **no surprises**: nothing lands in the specification without the
process above, and if that is ever violated, saying so publicly is the correct response.

<p class="mt-4">
  <a class="btn btn-primary" href="{{ site.issues }}">Argue with this →</a>
  <a class="btn btn-outline-primary ms-2" href="/contribute/">Other ways to help</a>
</p>

---

<p class="small text-muted">
  Sources, all primary: the
  <a href="https://github.com/OAI/OpenAPI-Specification/blob/main/GOVERNANCE.md">OpenAPI Specification governance document</a>,
  the <a href="https://github.com/asyncapi/community/blob/master/docs/020-governance-and-policies/GOVERNANCE.md">AsyncAPI governance document</a>,
  and the <a href="https://github.com/json-schema-org/community/blob/main/GOVERNANCE.md">JSON Schema governance document</a>.
  Read them rather than trusting this summary.
</p>
