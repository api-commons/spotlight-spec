#!/usr/bin/env node
// Regenerate schema/v1/spotlight-ruleset.schema.json from upstream Spectral's
// internal meta-schemas. This makes the bundle reproducible: re-run it after
// pulling a newer Spectral/spotlight-cli snapshot to re-derive the spec.
//
// Source files (the portable "json-extensions" variant is used, not the
// JS/runtime "js-extensions" variant):
//   packages/core/src/ruleset/meta/ruleset.schema.json
//   packages/core/src/ruleset/meta/rule.schema.json
//   packages/core/src/ruleset/meta/shared.json
//   packages/core/src/ruleset/meta/json-extensions.json
//
// Resolution order for the source tree:
//   1. --src <dir> / SPOTLIGHT_CLI=<dir>  (a local spotlight-cli or spectral checkout)
//   2. ../spotlight-cli  (sibling checkout)
//   3. download from api-commons/spotlight-cli @ main
//
// Usage:
//   node tools/sync-from-cli.mjs [--src <dir>] [--check]
//   --check  exit non-zero if the generated schema differs from the committed one.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const META = "packages/core/src/ruleset/meta";
const FILES = {
  ruleset: `${META}/ruleset.schema.json`,
  rule: `${META}/rule.schema.json`,
  shared: `${META}/shared.json`,
  extensions: `${META}/json-extensions.json`,
};
const OUT = join(root, "schema", "v1", "spotlight-ruleset.schema.json");
const CANONICAL_ID =
  "https://api-commons.github.io/spotlight-spec/schema/v1/spotlight-ruleset.schema.json";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const srcArg = (() => {
  const i = args.indexOf("--src");
  return i >= 0 ? args[i + 1] : process.env.SPOTLIGHT_CLI;
})();

// ---- locate + load the four source files -----------------------------------

async function load() {
  const candidates = [srcArg, join(root, "..", "spotlight-cli")].filter(Boolean);
  for (const dir of candidates) {
    if (existsSync(join(dir, FILES.ruleset))) {
      console.error(`source: local checkout ${dir}`);
      const read = (f) => JSON.parse(readFileSync(join(dir, FILES[f]), "utf8"));
      return { read: read, origin: dir };
    }
  }
  // Fall back to fetching from the fork.
  const base =
    "https://raw.githubusercontent.com/api-commons/spotlight-cli/main/";
  console.error(`source: download ${base}`);
  const cache = {};
  await Promise.all(
    Object.entries(FILES).map(async ([k, f]) => {
      const res = await fetch(base + f);
      if (!res.ok) throw new Error(`fetch ${f}: HTTP ${res.status}`);
      cache[k] = JSON.parse(await res.text());
    }),
  );
  return { read: (f) => cache[f], origin: base };
}

// ---- transformation --------------------------------------------------------

// $anchor name -> bundle $defs name.
const ANCHOR_NAMES = {
  formats: "Formats",
  severity: "Severity",
  given: "Given",
  "arrayish-given": "ArrayishGiven",
  format: "Format",
  functions: "Functions",
  functionsDir: "FunctionsDir",
  function: "Function",
  extends: "Extends",
};

// cross-file $ref tokens -> internal JSON Pointers.
const REF_MAP = {
  "shared#severity": "#/$defs/Severity",
  "shared#formats": "#/$defs/Formats",
  "shared#given": "#/$defs/Given",
  "shared#arrayish-given": "#/$defs/ArrayishGiven",
  "shared#/$defs/HumanReadableSeverity": "#/$defs/HumanReadableSeverity",
  "shared#/$defs/DiagnosticSeverity": "#/$defs/DiagnosticSeverity",
  "extensions#functions": "#/$defs/Functions",
  "extensions#functionsDir": "#/$defs/FunctionsDir",
  "extensions#function": "#/$defs/Function",
  "extensions#extends": "#/$defs/Extends",
  "extensions#format": "#/$defs/Format",
  "rule.schema#": "#/$defs/Rule",
  "path-expression": "#/$defs/PathExpression",
};

const clone = (x) => JSON.parse(JSON.stringify(x));

// Recursively delete the runtime-only x-spotlight-runtime hook (no validation effect).
function stripRuntime(node) {
  if (Array.isArray(node)) return node.forEach(stripRuntime);
  if (node && typeof node === "object") {
    delete node["x-spotlight-runtime"];
    for (const k of Object.keys(node)) stripRuntime(node[k]);
  }
}

// Rewrite a $ref token per a map (extra: an optional per-call override map).
function rewriteRefs(node, extra = {}) {
  if (Array.isArray(node)) return node.forEach((n) => rewriteRefs(n, extra));
  if (node && typeof node === "object") {
    if (typeof node.$ref === "string") {
      const map = { ...REF_MAP, ...extra };
      if (map[node.$ref]) node.$ref = map[node.$ref];
    }
    for (const k of Object.keys(node)) rewriteRefs(node[k], extra);
  }
}

const defs = {};

// Depth-first: extract every $anchor'd (or path-expression $id'd) node into the
// flat defs map, replacing it in place with a $ref. Children are processed before
// parents, so nested anchors (arrayish-given inside given) extract first.
function extractAnchors(parent) {
  const visit = (container, key) => {
    const node = container[key];
    if (Array.isArray(node)) {
      node.forEach((_, i) => visit(node, i));
    } else if (node && typeof node === "object") {
      for (const k of Object.keys(node)) visit(node, k);
      let name;
      if (typeof node.$anchor === "string") name = ANCHOR_NAMES[node.$anchor];
      else if (node.$id === "path-expression") name = "PathExpression";
      if (name) {
        const cleaned = { ...node };
        delete cleaned.$anchor;
        delete cleaned.$id;
        defs[name] = cleaned;
        container[key] = { $ref: `#/$defs/${name}` };
      }
    }
  };
  for (const k of Object.keys(parent)) visit(parent, k);
}

async function build() {
  const { read, origin } = await load();
  const ruleset = clone(read("ruleset"));
  const rule = clone(read("rule"));
  const shared = clone(read("shared"));
  const extensions = clone(read("extensions"));

  for (const s of [ruleset, rule, shared, extensions]) stripRuntime(s);

  // Pull anchored defs out of shared + json-extensions.
  extractAnchors(shared);
  extractAnchors(extensions);
  // Named (non-anchored) shared defs referenced by pointer.
  for (const name of ["DiagnosticSeverity", "HumanReadableSeverity"]) {
    if (shared.$defs?.[name]) defs[name] = clone(shared.$defs[name]);
  }

  // Assemble Rule + RuleThen from rule.schema (rename its local Then -> RuleThen,
  // drop its local Severity wrapper in favour of the shared one).
  defs.RuleThen = clone(rule.$defs.Then);
  defs.Rule = { if: clone(rule.if), then: clone(rule.then), else: clone(rule.else) };
  // Inside the rule body, the local "#/$defs/Then" pointer must target RuleThen.
  rewriteRefs(defs.Rule, { "#/$defs/Then": "#/$defs/RuleThen" });

  // Spotlight extension: `tags` as a first-class, documented property (the first
  // Spotlight addition beyond the Spectral baseline). Namespaced strings.
  const ruleProps = defs.Rule?.then?.properties;
  if (ruleProps) {
    ruleProps.tags = {
      type: "array",
      description:
        "Spotlight tags classifying the rule — the first Spotlight extension beyond " +
        "the Spectral baseline. Tags are namespaced strings; recommended namespaces: " +
        "`format:<artifact>` (the artifact type, e.g. `format:openapi`, `format:apis-json`), " +
        "`spec:<location>` (where in the document it applies, e.g. `spec:operations`, " +
        "`spec:responses`, `spec:schemas`), `experience:<dimension>` (the developer-" +
        "experience / quality dimension it improves — e.g. `experience:documentation`, " +
        "`experience:security`, `experience:error-handling`, `experience:naming`, " +
        "`experience:consistency`, `experience:versioning`, `experience:pagination`, " +
        "`experience:discoverability`, `experience:reliability`, `experience:data-modeling`, " +
        "`experience:usability`, `experience:governance`), and `source:<provider>` " +
        "(provenance). A rule may carry multiple tags; tooling groups and filters by them.",
      items: { type: "string" },
      examples: [
        ["format:openapi", "spec:operations", "spec:responses", "experience:error-handling", "experience:reliability"],
      ],
    };
  }

  // Global ref rewrite across every def and the root.
  for (const d of Object.values(defs)) rewriteRefs(d);

  // Build the root from ruleset.schema, swapping its identity + cross-file refs.
  const out = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: CANONICAL_ID,
    title: "Spotlight Ruleset",
    description:
      "Standalone JSON Schema for the Spotlight (Spectral) ruleset format — the " +
      "rules and rulesets used to lint JSON/YAML API descriptions such as OpenAPI, " +
      "AsyncAPI, and Arazzo. Self-contained bundle of Spectral's internal " +
      "meta-schemas; describes the serializable, implementation-neutral form.",
    $comment:
      "GENERATED by tools/sync-from-cli.mjs from Stoplight Spectral " +
      "(Apache-2.0). Do not edit by hand. The 'errorMessage' keyword is an " +
      "ajv-errors annotation ignored by standard validators. See PROVENANCE.md.",
  };
  for (const [k, v] of Object.entries(ruleset)) {
    if (k === "$schema" || k === "$id") continue;
    out[k] = v;
  }
  rewriteRefs(out);
  out.$defs = Object.fromEntries(Object.keys(defs).sort().map((k) => [k, defs[k]]));

  const json = JSON.stringify(out, null, 2) + "\n";

  if (checkOnly) {
    const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
    if (current !== json) {
      console.error("DRIFT: committed schema differs from generated output.");
      console.error(`Regenerate with: node tools/sync-from-cli.mjs  (source: ${origin})`);
      process.exit(1);
    }
    console.error("OK: committed schema matches generator output.");
    return;
  }

  writeFileSync(OUT, json);
  console.error(`wrote ${OUT} (${Object.keys(out.$defs).length} defs, source: ${origin})`);
}

build().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
