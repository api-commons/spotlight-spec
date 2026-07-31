#!/usr/bin/env python3
"""Build _data/roadmap.json from GitHub issues labeled `roadmap`.

The roadmap is not a hand-maintained page. It is whatever is labeled, in the open,
on the repositories that do the work — so the reasoning behind every roadmap item
has a public thread, and every item that gets built has a pull request pointing back
at that thread.

Labels this reads:

  roadmap            proposed for the roadmap (required — nothing else is included)
  roadmap:approved   approved for inclusion
  roadmap:deferred   considered and parked

  maturity:raised      raised, little or no discussion yet
  maturity:discussing  active discussion, no rough consensus
  maturity:consensus   rough consensus on what to do
  maturity:ready       ready to implement — one issue, one PR

Usage:
    python3 scripts/fetch_roadmap.py api-commons/spotlight-spec [more/repos ...]

Auth: GITHUB_TOKEN or GH_TOKEN in the environment, else `gh auth token`.
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

API = "https://api.github.com/graphql"

QUERY = """
query($owner:String!, $name:String!, $after:String) {
  repository(owner:$owner, name:$name) {
    issues(first:50, after:$after, labels:["roadmap"],
           states:[OPEN,CLOSED], orderBy:{field:CREATED_AT, direction:ASC}) {
      pageInfo { hasNextPage endCursor }
      nodes {
        number title url state createdAt updatedAt closedAt
        comments { totalCount }
        labels(first:30) { nodes { name } }
        timelineItems(first:50, itemTypes:[CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
          nodes {
            __typename
            ... on CrossReferencedEvent {
              source { ... on PullRequest { number url state title merged } }
            }
            ... on ConnectedEvent {
              subject { ... on PullRequest { number url state title merged } }
            }
          }
        }
      }
    }
  }
}
"""

MATURITY_ORDER = ["raised", "discussing", "consensus", "ready"]


def token():
    for var in ("GITHUB_TOKEN", "GH_TOKEN"):
        if os.environ.get(var):
            return os.environ[var]
    try:
        return subprocess.check_output(["gh", "auth", "token"], text=True).strip()
    except Exception:
        sys.exit("No GitHub token: set GITHUB_TOKEN or authenticate with `gh auth login`.")


def graphql(tok, variables):
    req = urllib.request.Request(
        API,
        data=json.dumps({"query": QUERY, "variables": variables}).encode(),
        headers={
            "Authorization": f"bearer {tok}",
            "Accept": "application/vnd.github+json",
            "User-Agent": "spotlight-roadmap",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        sys.exit(f"GitHub API error {exc.code}: {exc.read().decode()[:400]}")
    if "errors" in payload:
        sys.exit("GitHub API error: " + json.dumps(payload["errors"])[:400])
    return payload["data"]["repository"]["issues"]


def linked_prs(node):
    seen, out = set(), []
    for item in node["timelineItems"]["nodes"]:
        pr = item.get("source") or item.get("subject") or {}
        num = pr.get("number")
        if num is None or num in seen:
            continue
        seen.add(num)
        out.append(
            {
                "number": num,
                "title": pr.get("title"),
                "url": pr.get("url"),
                "state": (pr.get("state") or "").lower(),
                "merged": bool(pr.get("merged")),
            }
        )
    return sorted(out, key=lambda p: p["number"])


def fetch(tok, slug):
    owner, name = slug.split("/")
    items, cursor = [], None
    while True:
        page = graphql(tok, {"owner": owner, "name": name, "after": cursor})
        for node in page["nodes"]:
            labels = [lab["name"] for lab in node["labels"]["nodes"]]
            maturity = next(
                (lab.split(":", 1)[1] for lab in labels if lab.startswith("maturity:")), None
            )
            items.append(
                {
                    "repo": name,
                    "repo_slug": slug,
                    "number": node["number"],
                    "title": node["title"],
                    "url": node["url"],
                    "state": node["state"].lower(),
                    "approved": "roadmap:approved" in labels,
                    "deferred": "roadmap:deferred" in labels,
                    "maturity": maturity,
                    "maturity_rank": MATURITY_ORDER.index(maturity) if maturity in MATURITY_ORDER else -1,
                    "labels": sorted(labels),
                    "comments": node["comments"]["totalCount"],
                    "created_at": node["createdAt"],
                    "updated_at": node["updatedAt"],
                    "closed_at": node["closedAt"],
                    "prs": linked_prs(node),
                }
            )
        if not page["pageInfo"]["hasNextPage"]:
            return items
        cursor = page["pageInfo"]["endCursor"]


def main():
    slugs = sys.argv[1:]
    if not slugs:
        sys.exit(__doc__)
    tok = token()
    items = []
    for slug in slugs:
        items.extend(fetch(tok, slug))

    # Deferred last, then closed, then by maturity (most mature first), then by number.
    items.sort(key=lambda i: (i["deferred"], i["state"] == "closed", -i["maturity_rank"], i["repo"], i["number"]))

    out = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "repos": slugs,
        "counts": {
            "total": len(items),
            "open": sum(1 for i in items if i["state"] == "open"),
            "approved": sum(1 for i in items if i["approved"]),
            "deferred": sum(1 for i in items if i["deferred"]),
            "with_prs": sum(1 for i in items if i["prs"]),
            **{m: sum(1 for i in items if i["maturity"] == m) for m in MATURITY_ORDER},
        },
        "items": items,
    }

    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(root, "_data")
    os.makedirs(data_dir, exist_ok=True)
    path = os.path.join(data_dir, "roadmap.json")
    with open(path, "w") as handle:
        json.dump(out, handle, indent=2)
        handle.write("\n")
    print(f"{path}: {len(items)} item(s) from {', '.join(slugs)}")


if __name__ == "__main__":
    main()
