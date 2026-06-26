# Spotlight rule catalog

Generated from the curated `all-rules.yaml` by `tools/build-catalog.mjs`. Each
`<format>.spotlight.yaml` is a ready-to-use Spotlight ruleset; built-in rules come
from the engine's `spotlight:*` rulesets via `extends`, and custom functions are
bundled in `functions/` and wired through `functionsDir`.

Use one directly:

```bash
spotlight lint api.yaml --ruleset ./openapi.spotlight.yaml
```

or `extends` it from your own ruleset. 597 rules across 12 formats; 28 custom functions.

Notes:
- The bundled `functions/` are used **with** the Spotlight engine — a few import
  `@spotlight-rules/spotlight-core`, so run them where the engine is installed
  (the CLI / api / mcp all qualify).
- `agent-skill.spotlight.yaml` is `extends: spotlight:skill` (the engine's
  agent-skill ruleset) rather than re-emitting its rules.
- Regenerate after editing the catalog: `node tools/build-catalog.mjs`.
