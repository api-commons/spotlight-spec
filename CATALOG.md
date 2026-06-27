# The Spotlight rule catalog

The catalog is the suite's product — one curated set of rules every surface uses.
This documents its single source of truth and the deterministic pipeline that
keeps every consumer in sync.

## Source of truth

```
spotlight-validator/rules/all-rules.yaml      # THE editable catalog (733 rules)
spotlight-validator/src/functions/**          # the custom functions rules reference
```

The validator is where rules are **authored** (its `rules/sources/*` + `tools/compile-rules.mjs`
compile public rulesets into the catalog, then it's hand-curated). spotlight-spec is
where the catalog is **specified and distributed**.

## Generators (all read the one source; outputs are committed)

| Command | Repo | Produces |
| --- | --- | --- |
| `npm run sync:catalog` | validator | `src/all-rules.json` — the bundle the validator runs |
| `npm run export:site` | validator | `spotlight-rules/_rules/**` + `_data/rule_index.json` — the rule explorer |
| `npm run build:catalog` | spec | `catalog/<format>.spotlight.yaml` + `functions/` + `catalog.json` — the distributable pack + index |

## Drift gates (CI fails if a committed artifact is stale)

| Command | Guards |
| --- | --- |
| `npm run check:catalog` (validator) | `src/all-rules.json` matches `all-rules.yaml` |
| `npm run check:rulesets` (validator) | every format constructs + runs against the real engine |
| `npm run check:skill-sync` (validator) | `spotlight:skill` (cli) matches the agent-skill catalog by name |
| `npm run check:catalog` (spec) | `catalog/` pack matches the source |

## To change a rule

1. Edit `spotlight-validator/rules/all-rules.yaml`.
2. `cd spotlight-validator && npm run sync:catalog && npm run export:site`.
3. `cd spotlight-spec && npm run build:catalog`.
4. Commit the regenerated artifacts in each repo. CI re-runs every `--check`.

> Note: the source lives in the validator because the custom functions and the
> compile pipeline live there. A future consolidation could move the source +
> functions into a dedicated package that all surfaces depend on.
