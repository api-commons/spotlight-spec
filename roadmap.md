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

---

## The fifth thing, which is not a document

All four workstreams above assume somebody is here to do them, and right now that is one person.
**A specification with one maintainer is not a specification, it is a file somebody happens to be
editing.** Fixing that is not downstream of the drafting work — it is the precondition for any of it
mattering in five years.

[Governance](/governance/) reads how OpenAPI, AsyncAPI and JSON Schema handle this and proposes
something deliberately small, designed to grow in stages triggered by facts rather than dates.
Co-maintainers are welcome and actively wanted.

---

# The tracked work

Everything above is the shape. **Everything below is generated from issues labeled `roadmap` on
[this repository]({{ site.repo }})**, refreshed automatically — no hand-maintained list, because a
hand-maintained roadmap is a claim and a generated one is an artifact.

This page covers the **specification only**. The [main site]({{ site.site_main }}/roadmap/) shows
the same view across both the specification and the reference implementation.

Two rules keep it honest:

1. **An item earns its place by being an issue first**, so the reasoning is public and the
   objections are recorded before anything gets built.
2. **One issue, one pull request.** When an item moves into development, the pull request that
   implements it references that issue and only that issue — so the homework behind every roadmap
   item has provenance you can follow, from the argument through the decision to the diff.

<div class="row g-3 my-4">
  <div class="col-6 col-lg-3">
    <div class="card h-100"><div class="card-body py-3">
      <div class="stat fs-3">{{ site.data.roadmap.counts.open }}</div>
      <div class="small text-muted">open items</div>
    </div></div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card h-100"><div class="card-body py-3">
      <div class="stat fs-3">{{ site.data.roadmap.counts.ready }}</div>
      <div class="small text-muted">ready to implement</div>
    </div></div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card h-100"><div class="card-body py-3">
      <div class="stat fs-3">{{ site.data.roadmap.counts.discussing }}</div>
      <div class="small text-muted">still being argued</div>
    </div></div>
  </div>
  <div class="col-6 col-lg-3">
    <div class="card h-100"><div class="card-body py-3">
      <div class="stat fs-3">{{ site.data.roadmap.counts.with_prs }}</div>
      <div class="small text-muted">with a pull request</div>
    </div></div>
  </div>
</div>

| Label | What it means |
|---|---|
| `roadmap` | Proposed for the roadmap. Everything below carries it. |
| `roadmap:approved` | Approved for inclusion — it is going to happen, whatever the sequencing. |
| `roadmap:deferred` | Considered and parked. Still listed, because a decision not to do something is also a decision. |
| `maturity:raised` | Raised. Little or no discussion yet — the cheapest moment to redirect it. |
| `maturity:discussing` | Active discussion, no rough consensus. |
| `maturity:consensus` | Rough consensus on what to do, not yet specified enough to build. |
| `maturity:ready` | Ready to implement. One issue, one pull request. |

**Maturity describes the conversation, not the code.** Nothing gets promoted by age.

{% assign live = site.data.roadmap.items | where_exp: "i", "i.deferred == false and i.state == 'open'" %}
{% assign done = site.data.roadmap.items | where_exp: "i", "i.state == 'closed'" %}
{% assign parked = site.data.roadmap.items | where_exp: "i", "i.deferred and i.state == 'open'" %}
{% assign groups = "ready,consensus,discussing,raised" | split: "," %}
{% for g in groups %}
{% assign bucket = live | where: "maturity", g %}
{% if bucket.size > 0 %}
## {% case g %}{% when 'ready' %}Ready to implement{% when 'consensus' %}Rough consensus{% when 'discussing' %}Under discussion{% when 'raised' %}Raised{% endcase %}

<p class="text-muted small">{% case g %}{% when 'ready' %}Specified enough that the next step is a pull request.{% when 'consensus' %}Agreement on what to do. Still needs pinning down before anyone builds it.{% when 'discussing' %}Genuinely open. This is where arguing is worth the most.{% when 'raised' %}Newly raised, barely discussed. Easiest to redirect.{% endcase %}</p>

<div class="list-group mb-4">
{% for item in bucket %}
  <div class="list-group-item">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap">
      <div>
        <a class="fw-semibold" href="{{ item.url }}">{{ item.title }}</a>
        <div class="small text-muted mt-1">
          <a href="{{ item.url }}">#{{ item.number }}</a>
          &middot; {{ item.comments }} comment{% unless item.comments == 1 %}s{% endunless %}
          {% if item.approved %}&middot; <span class="badge bg-dark">approved</span>{% endif %}
        </div>
      </div>
      <div class="text-end small">
        {% if item.prs.size > 0 %}
          {% for pr in item.prs %}<div><a href="{{ pr.url }}">PR #{{ pr.number }}</a>{% if pr.merged %} <span class="badge bg-success">merged</span>{% else %} <span class="badge bg-secondary">{{ pr.state }}</span>{% endif %}</div>{% endfor %}
        {% else %}
          <span class="text-muted">no PR yet</span>
        {% endif %}
      </div>
    </div>
  </div>
{% endfor %}
</div>
{% endif %}
{% endfor %}

{% if parked.size > 0 %}
## Parked

<ul>
{% for item in parked %}
  <li><a href="{{ item.url }}">{{ item.title }}</a> <span class="text-muted small">— #{{ item.number }}</span></li>
{% endfor %}
</ul>
{% endif %}

{% if done.size > 0 %}
## Done

<ul>
{% for item in done %}
  <li><a href="{{ item.url }}">{{ item.title }}</a> <span class="text-muted small">— #{{ item.number }}{% for pr in item.prs %}, <a href="{{ pr.url }}">PR #{{ pr.number }}</a>{% endfor %}</span></li>
{% endfor %}
</ul>
{% endif %}

<p class="text-muted small">Generated {{ site.data.roadmap.generated }} from {{ site.data.roadmap.repos | join: ", " }}.</p>

<p class="mt-4">
  <a class="btn btn-primary" href="/contribute/">How to help →</a>
  <a class="btn btn-outline-primary ms-2" href="{{ site.issues }}">Open issues</a>
</p>
