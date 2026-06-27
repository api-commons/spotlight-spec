# Spotlight rule catalog

Generated from the curated `all-rules.yaml` by `tools/build-catalog.mjs` — do not
edit by hand. Each `<format>.spotlight.yaml` is a ready-to-use Spotlight ruleset;
built-ins come from the engine's `spotlight:*` rulesets via `extends`, and custom
functions are bundled in `functions/` and wired through `functionsDir`.
`catalog.json` is a flat rule index for tooling.

Use one directly:

```bash
spotlight lint api.yaml --ruleset ./openapi.spotlight.yaml
```

or `extends` it. 597 authored rules across 12 formats; 28 custom functions; 733 rules indexed.

Notes:
- The bundled `functions/` are used **with** the engine (a few import
  `@spotlight-rules/spotlight-core`), so run them where the engine is installed.
- `agent-skill.spotlight.yaml` is `extends: spotlight:skill`.
- Regenerate: `node tools/build-catalog.mjs` (CI runs `--check`).
