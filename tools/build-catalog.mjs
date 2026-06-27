#!/usr/bin/env node
// Build the distributable Spotlight rule catalog from the curated source
// (validator's all-rules.yaml) into engine-loadable artifacts under catalog/:
//   <format>.spotlight.yaml  — a Spotlight ruleset per artifact format
//   functions/<name>.js      — the custom functions those rules reference
//   catalog.json             — a flat rule index for third-party tools
// Consumable by the CLI / api / mcp / pipeline via `extends` or --ruleset.
//
// Namespaced function refs (`trimble:valid-url-checker`) are flattened to a
// loadable name (`trimble-valid-url-checker`) wired through functionsDir; built-in
// rules come from the engine's spotlight:* rulesets via `extends`.
//
//   node tools/build-catalog.mjs            # regenerate catalog/
//   node tools/build-catalog.mjs --check    # fail if catalog/ is stale (CI gate)
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ALL_RULES = join(ROOT, '..', 'spotlight-validator', 'rules', 'all-rules.yaml');
const FN_SRC = join(ROOT, '..', 'spotlight-validator', 'src', 'functions');
const OUT = join(ROOT, 'catalog');
const DOC = 'https://spotlight-rules.com/spec/';
const check = process.argv.includes('--check');

const EXTENDS_FOR = { openapi: 'spotlight:oas', asyncapi: 'spotlight:asyncapi', arazzo: 'spotlight:arazzo', 'agent-skill': 'spotlight:skill' };
const flat = (fn) => fn.replace(':', '-');
const fileFor = (fn) => join(FN_SRC, ...fn.split(':')) + '.js';
const tagVals = (tags, ns) => (tags || []).filter((t) => t.startsWith(ns + ':')).map((t) => t.slice(ns.length + 1));

const all = parse(readFileSync(ALL_RULES, 'utf8'));

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

// Assemble the entire output as a relpath -> content map, then write or check it.
const files = new Map();
const index = [];
const summary = [];
let totalRules = 0;

for (const [fmt, rules] of Object.entries(all)) {
  for (const [slug, r] of Object.entries(rules)) {
    index.push({
      slug, format: fmt, name: r.title || slug, severity: r.severity || 'info',
      description: r.description || '', reference: r.reference || '', source: r.source || '',
      tags: { experience: tagVals(r.tags, 'experience'), spec: tagVals(r.tags, 'spec'), topic: tagVals(r.tags, 'topic'), owasp: tagVals(r.tags, 'owasp') },
    });
  }
  if (fmt === 'agent-skill') {
    files.set('agent-skill.spotlight.yaml', stringify({ extends: EXTENDS_FOR[fmt], documentationUrl: DOC }));
    summary.push('agent-skill: extends spotlight:skill');
    continue;
  }
  const local = new Set();
  const out = {};
  for (const [name, r] of Object.entries(rules)) { if (r.source === 'builtin') continue; out[name] = engineRule(r, local); }
  if (!Object.keys(out).length) continue;
  const def = {};
  if (EXTENDS_FOR[fmt]) def.extends = EXTENDS_FOR[fmt];
  if (local.size) { def.functions = [...local].map(flat).sort(); def.functionsDir = './functions'; }
  def.documentationUrl = DOC;
  def.rules = out;
  files.set(`${fmt}.spotlight.yaml`, stringify(def));
  totalRules += Object.keys(out).length;
  summary.push(`${fmt}: ${Object.keys(out).length} rules${local.size ? `, ${local.size} fns` : ''}`);
}

let copied = 0;
for (const fn of usedFns) {
  if (!existsSync(fileFor(fn))) { console.warn('  missing function file:', fn); continue; }
  files.set(join('functions', `${flat(fn)}.js`), readFileSync(fileFor(fn), 'utf8'));
  copied++;
}

index.sort((a, b) => a.format.localeCompare(b.format) || a.slug.localeCompare(b.slug));
files.set('catalog.json', JSON.stringify({ rules: index }, null, 1) + '\n');
files.set('README.md', `# Spotlight rule catalog

Generated from the curated \`all-rules.yaml\` by \`tools/build-catalog.mjs\` — do not
edit by hand. Each \`<format>.spotlight.yaml\` is a ready-to-use Spotlight ruleset;
built-ins come from the engine's \`spotlight:*\` rulesets via \`extends\`, and custom
functions are bundled in \`functions/\` and wired through \`functionsDir\`.
\`catalog.json\` is a flat rule index for tooling.

Use one directly:

\`\`\`bash
spotlight lint api.yaml --ruleset ./openapi.spotlight.yaml
\`\`\`

or \`extends\` it. ${totalRules} authored rules across ${summary.length} formats; ${copied} custom functions; ${index.length} rules indexed.

Notes:
- The bundled \`functions/\` are used **with** the engine (a few import
  \`@spotlight-rules/spotlight-core\`), so run them where the engine is installed.
- \`agent-skill.spotlight.yaml\` is \`extends: spotlight:skill\`.
- Regenerate: \`node tools/build-catalog.mjs\` (CI runs \`--check\`).
`);

function listAll(dir, base = dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? listAll(p, base) : [relative(base, p)];
  });
}

if (check) {
  const want = new Set(files.keys());
  let drift = 0;
  for (const rel of listAll(OUT)) if (!want.has(rel)) { console.error('  extra file:', rel); drift++; }
  for (const [rel, content] of files) {
    const p = join(OUT, rel);
    if (!existsSync(p) || readFileSync(p, 'utf8') !== content) { console.error('  out of sync:', rel); drift++; }
  }
  if (drift) { console.error(`DRIFT: catalog/ is stale (${drift} file(s)). Run: node tools/build-catalog.mjs`); process.exit(1); }
  console.log(`catalog pack in sync (${files.size} files).`);
} else {
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  for (const [rel, content] of files) { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, content); }
  console.log(`wrote ${summary.length} ruleset files + ${copied} functions + catalog.json to catalog/`);
  for (const s of summary) console.log('  ' + s);
}
