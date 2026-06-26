#!/usr/bin/env node
// Build the distributable Spotlight rule catalog from the validator's curated
// all-rules.yaml into engine-loadable ruleset files:
//   catalog/<format>.spotlight.yaml  — a Spotlight ruleset per artifact format
//   catalog/functions/<name>.js      — the custom functions those rules reference
// The result is consumable by the CLI / api / mcp / pipeline (via `extends` or
// --ruleset), so every surface can lint with the same rules as the validator.
//
// Namespaced function refs (e.g. `trimble:valid-url-checker`) are flattened to a
// filesystem-loadable name (`trimble-valid-url-checker`) wired through functionsDir.
// Catalog-only metadata (title/reference/prompt/source) is stripped; built-in
// rules are supplied by the engine's spotlight:* rulesets via `extends`.
//
// Run from spotlight-spec: node tools/build-catalog.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATOR = join(ROOT, '..', 'spotlight-validator');
const ALL_RULES = join(VALIDATOR, 'rules', 'all-rules.yaml');
const FN_SRC = join(VALIDATOR, 'src', 'functions');
const OUT = join(ROOT, 'catalog');
const FN_OUT = join(OUT, 'functions');

const EXTENDS_FOR = { openapi: 'spotlight:oas', asyncapi: 'spotlight:asyncapi', arazzo: 'spotlight:arazzo', 'agent-skill': 'spotlight:skill' };
const flat = (fn) => fn.replace(':', '-'); // trimble:x -> trimble-x
const fileFor = (fn) => join(FN_SRC, ...fn.split(':')); // trimble:x -> functions/trimble/x.js (+.js)

const all = parse(readFileSync(ALL_RULES, 'utf8'));
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(FN_OUT, { recursive: true });

// rewrite then.function refs: flatten custom (namespaced) ones, collecting both
// per-format (for that ruleset's `functions` list) and globally (for copying).
const usedFns = new Set();
function rewrite(node, local) {
  if (Array.isArray(node)) return node.map((n) => rewrite(n, local));
  if (node && typeof node === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(node)) {
      if (k === 'function' && typeof v === 'string' && v.includes(':')) { local.add(v); usedFns.add(v); o[k] = flat(v); }
      else o[k] = rewrite(v, local);
    }
    return o;
  }
  return node;
}
const engineRule = (r, local) => { const { source, title, reference, prompt, ...rest } = r; rest.then = rewrite(rest.then, local); return rest; };

let totalRules = 0;
const summary = [];
for (const [fmt, rules] of Object.entries(all)) {
  // agent-skill is fully covered by the engine's spotlight:skill ruleset (its
  // rules use inline skill functions) — emit an extends-only ruleset.
  if (fmt === 'agent-skill') {
    writeFileSync(join(OUT, 'agent-skill.spotlight.yaml'), stringify({ extends: EXTENDS_FOR[fmt], documentationUrl: 'https://spotlight-rules.com/spec/' }));
    summary.push(`agent-skill: extends spotlight:skill`);
    continue;
  }
  const local = new Set();
  const out = {};
  for (const [name, r] of Object.entries(rules)) {
    if (r.source === 'builtin') continue; // built-ins come from extends
    out[name] = engineRule(r, local);
  }
  if (!Object.keys(out).length) continue;
  const def = {};
  if (EXTENDS_FOR[fmt]) def.extends = EXTENDS_FOR[fmt];
  if (local.size) { def.functions = [...local].map(flat).sort(); def.functionsDir = './functions'; }
  def.documentationUrl = 'https://spotlight-rules.com/spec/';
  def.rules = out;
  writeFileSync(join(OUT, `${fmt}.spotlight.yaml`), stringify(def));
  totalRules += Object.keys(out).length;
  summary.push(`${fmt}: ${Object.keys(out).length} rules${local.size ? `, ${local.size} fns` : ''}`);
}

// copy every referenced custom function, flattened
let copied = 0;
for (const fn of usedFns) {
  const src = fileFor(fn) + '.js';
  if (!existsSync(src)) { console.warn('  missing function file:', fn); continue; }
  copyFileSync(src, join(FN_OUT, `${flat(fn)}.js`));
  copied++;
}

writeFileSync(join(OUT, 'README.md'), `# Spotlight rule catalog

Generated from the curated \`all-rules.yaml\` by \`tools/build-catalog.mjs\`. Each
\`<format>.spotlight.yaml\` is a ready-to-use Spotlight ruleset; built-in rules come
from the engine's \`spotlight:*\` rulesets via \`extends\`, and custom functions are
bundled in \`functions/\` and wired through \`functionsDir\`.

Use one directly:

\`\`\`bash
spotlight lint api.yaml --ruleset ./openapi.spotlight.yaml
\`\`\`

or \`extends\` it from your own ruleset. ${totalRules} rules across ${summary.length} formats; ${copied} custom functions.

Notes:
- The bundled \`functions/\` are used **with** the Spotlight engine — a few import
  \`@spotlight-rules/spotlight-core\`, so run them where the engine is installed
  (the CLI / api / mcp all qualify).
- \`agent-skill.spotlight.yaml\` is \`extends: spotlight:skill\` (the engine's
  agent-skill ruleset) rather than re-emitting its rules.
- Regenerate after editing the catalog: \`node tools/build-catalog.mjs\`.
`);

console.log(`wrote ${summary.length} ruleset files + ${copied} functions to catalog/`);
for (const s of summary) console.log('  ' + s);
