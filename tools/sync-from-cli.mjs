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

// ---- Spotlight documentation enrichment ------------------------------------
// The upstream Spectral meta-schemas ship almost no `description`s, which makes
// the bundle hard to use in an editor or on SchemaStore. This pass attaches
// human-readable `description`/`title`/`examples` to every property and $def
// that lacks one. These are ANNOTATIONS ONLY: they never change which documents
// validate, so the accepted/rejected set still matches upstream (see PROVENANCE.md).
function enrich(out) {
  // Only fills gaps — never clobbers an annotation already set above (e.g. the
  // Spotlight tags/title/reference/prompt descriptions).
  const set = (node, ann) => {
    if (!node || typeof node !== "object") return;
    for (const [k, v] of Object.entries(ann)) if (node[k] === undefined) node[k] = v;
  };

  const P = out.properties || {};

  // ---- root-level properties ----
  set(P.documentationUrl, { description: "URL to human-readable documentation for this ruleset as a whole. Tooling may surface it alongside the ruleset's findings." });
  set(P.description, { description: "A short, human-readable summary of what this ruleset checks and who it is for." });
  set(P.rules, { description: "The rules in this ruleset, keyed by a unique rule name (e.g. `operation-operationId-unique`). Each value is a full rule object, or — when only adjusting an inherited rule — a bare severity (`error`/`warn`/`info`/`hint`/`off` or `0`–`3`) or `false` to turn the rule off." });
  set(P.functions, { description: "Names of custom functions this ruleset provides, loaded from `functionsDir`. Used by JavaScript-authored rulesets; serialized/data rulesets normally rely on the built-in core functions instead." });
  set(P.functionsDir, { description: "Directory (relative to the ruleset file) that the custom functions named in `functions` are loaded from. Defaults to `functions`." });
  set(P.formats, { description: "Default document formats this ruleset targets (e.g. `oas3_1`, `asyncapi2`, `arazzo1`). Applied to every rule that does not set its own `formats`; a rule only runs against documents whose detected format matches." });
  set(P.extends, { description: "One or more parent rulesets to inherit rules from. Each entry is a ruleset reference, or a `[reference, modifier]` pair whose modifier (`recommended`, `all`, or `off`) selects how many of the parent's rules to enable." });
  set(P.overrides, { description: "Per-file or per-location overrides. Each entry matches documents by glob (optionally narrowing to JSON Pointer locations within them) and then changes rule severities or supplies an alternate set of rules/extends/formats for just those targets." });
  set(P.aliases, { description: "Reusable, named `given` targets. Define a path (or a set of format-specific paths) once, then reference it from any rule's `given` as `#AliasName` to keep rules DRY and readable." });
  set(P.parserOptions, { description: "How the parser treats structural problems in the document being linted (as opposed to rule violations)." });
  set(P.parserOptions?.properties?.duplicateKeys, { description: "Severity to report when a duplicate key is found in a JSON/YAML object. Defaults to `error`." });
  set(P.parserOptions?.properties?.incompatibleValues, { description: "Severity to report when a value is incompatible with the parser's expectations (e.g. a YAML construct JSON cannot represent). Defaults to `error`." });

  // ---- shared $defs ----
  const d = out.$defs || {};
  set(d.ArrayishGiven, { title: "Path Expression List", description: "A non-empty array of JSONPath / alias expressions. Use when a rule or alias targets more than one location." });
  set(d.DiagnosticSeverity, { title: "Numeric Severity", description: "Severity as a number: `0` error, `1` warn, `2` info, `3` hint. `-1` leaves an inherited severity unchanged." });
  set(d.HumanReadableSeverity, { title: "Severity Word", description: "Severity as a word: `error`, `warn`, `info`, `hint`, or `off` to disable the rule." });
  set(d.Severity, { title: "Severity", description: "How loud a violation is — a word (`error`/`warn`/`info`/`hint`/`off`) or the equivalent number (`0`–`3`, or `-1` to leave an inherited severity unchanged). Defaults to `warn` when omitted on a rule." });
  set(d.Extends, { title: "Extends", description: "A parent ruleset reference, or an array of references and/or `[reference, modifier]` pairs. The modifier (`recommended` | `all` | `off`) controls which of the parent's rules are enabled." });
  set(d.Format, { title: "Format", description: "A single document-format identifier, e.g. `oas2`, `oas3_0`, `oas3_1`, `asyncapi2`, `arazzo1`, or `json-schema-draft7`." });
  set(d.Formats, { title: "Formats", description: "An array of document-format identifiers a rule or ruleset applies to." });
  set(d.Function, { title: "Function Invocation", description: "Names the function that evaluates the targeted value." });
  set(d.Function?.properties?.function, { description: "The function to run — a built-in core function (`pattern`, `length`, `enumeration`, `casing`, `schema`, `alphabetical`, `xor`, `truthy`, `falsy`, `defined`, `undefined`, `unreferencedReusableObject`, `typedEnum`) or a custom function declared in `functions`.", examples: ["truthy", "pattern", "casing"] });
  set(d.Functions, { title: "Custom Function Names", description: "Names of custom functions made available to rules, loaded from `functionsDir`." });
  set(d.FunctionsDir, { title: "Functions Directory", description: "Directory the custom functions are loaded from, relative to the ruleset file." });
  set(d.Given, { title: "Given (Target Selector)", description: "Where a rule looks: a JSONPath expression (e.g. `$.paths[*][*]`) or an alias reference (`#AliasName`) — or an array of them to target several locations at once." });
  set(d.PathExpression, { title: "JSONPath or Alias Expression", description: "A JSONPath expression beginning with `$`, or an alias reference beginning with `#`. Selects nodes in the document being linted." });
  set(d.Rule, { title: "Rule", description: "A single lint rule: where to look (`given`, optionally a `field` and `formats`) and what must hold there (`then` — a function plus options). Add `severity`, `message`, and the Spotlight metadata (`title`, `tags`, `reference`, `prompt`) to make findings clear and actionable. When only adjusting an inherited rule, the value may instead be a bare severity or `false`." });
  set(d.RuleThen, { title: "Assertion", description: "What must be true at each targeted node: run `function` (optionally against a single `field`) with `functionOptions`. Supply an array of these to assert several things at once." });

  // ---- rule body fields ----
  const rp = d.Rule?.then?.properties || {};
  set(rp.description, { description: "Human-readable explanation of what the rule enforces and why. Shown in rule catalogs and, when `message` is absent, in lint output." });
  set(rp.documentationUrl, { description: "URL to documentation for this specific rule. (Spotlight's `reference` is the preferred field for catalog deep-links; this is the Spectral-native equivalent.)" });
  set(rp.recommended, { description: "Whether the rule belongs to the `recommended` subset. Consumers who extend this ruleset with the `recommended` modifier get only rules marked `true`; the `all` modifier enables every rule regardless." });
  set(rp.given, { description: "The node(s) the rule targets — a JSONPath expression or alias (`#Alias`), or an array of them.", examples: ["$.paths[*][*]", ["$.components.schemas[*]", "#OperationObject"]] });
  set(rp.resolved, { description: "Whether the rule runs against the fully `$ref`-resolved document (`true`, the default) or the raw, unresolved document (`false`). Use `false` for rules that inspect `$ref`s themselves." });
  set(rp.severity, { description: "Severity of this rule's findings. Defaults to `warn` when omitted.", examples: ["warn"] });
  set(rp.message, { description: "Custom message shown for a violation. Supports placeholders: `{{error}}` (the function's own message), `{{path}}`, `{{property}}`, `{{value}}`, and `{{description}}` (the rule's description).", examples: ["{{property}} must be written in kebab-case", "Operation must define a 429 response"] });
  set(rp.formats, { description: "Document formats this rule applies to, overriding the ruleset-level `formats`. The rule is skipped for documents of any other format." });
  set(rp.then, { description: "The assertion(s) to evaluate at each targeted node — a single assertion or an array of them." });
  set(rp.type, { description: "Classifies the rule as `style` (conventions / consistency) or `validation` (structural correctness). Some tools group results by this." });
  set(rp.extensions, { description: "Free-form object for tool-specific metadata not covered by the standard fields." });

  // ---- RuleThen.field (sits in an allOf branch) ----
  for (const branch of d.RuleThen?.allOf || []) {
    set(branch?.properties?.field, { description: "Narrows the assertion to a single child of the targeted node — an object key, or `@key` to assert on the node's own key. Omit to assert on the whole targeted value." });
  }

  // ---- root: a couple of worked examples for editors / SchemaStore ----
  if (out.examples === undefined) {
    out.examples = [
      { extends: [["spotlight:oas", "recommended"]] },
      {
        description: "House style for our OpenAPI documents.",
        formats: ["oas3_1"],
        rules: {
          "response-define-429": {
            description: "Rate-limitable operations should define a 429 (Too Many Requests) response.",
            severity: "warn",
            given: "$.paths[*][*].responses",
            then: { field: "429", function: "truthy" },
            title: "Response Define 429",
            tags: ["format:openapi", "spec:responses", "topic:rate-limiting", "owasp:api4"],
            reference: "https://spotlight-rules.com/spec/rules/openapi/response-define-429/",
          },
        },
      },
    ];
  }
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

  // Spotlight: per-function `functionOptions` schemas for the built-in core
  // functions, so editors can autocomplete + validate a rule's then-options.
  // Custom (namespaced) functions are unconstrained.
  const CORE_OPTS = {
    pattern: { type: "object", description: "Options for the `pattern` function — assert the targeted value against a regular expression.", properties: { match: { type: "string", description: "Regular expression the value MUST match." }, notMatch: { type: "string", description: "Regular expression the value must NOT match." } }, anyOf: [{ required: ["match"] }, { required: ["notMatch"] }], additionalProperties: false },
    length: { type: "object", description: "Options for the `length` function — bound the length of a string/array or the number of object keys.", properties: { min: { type: "number", description: "Minimum allowed length (inclusive)." }, max: { type: "number", description: "Maximum allowed length (inclusive)." } }, additionalProperties: false },
    enumeration: { type: "object", description: "Options for the `enumeration` function — require the value to be one of a fixed set.", properties: { values: { type: "array", description: "The allowed values." } }, required: ["values"], additionalProperties: false },
    casing: { type: "object", description: "Options for the `casing` function — require the value to follow a naming convention.", properties: { type: { description: "The casing convention the value must follow.", enum: ["flat", "camel", "pascal", "kebab", "cobol", "snake", "macro"] }, disallowDigits: { type: "boolean", description: "When true, digits are not allowed anywhere in the value." }, separator: { type: "object", description: "An optional extra separator permitted between casing-conformant segments (e.g. `/` in path segments).", properties: { char: { type: "string", description: "The single separator character allowed." }, allowLeading: { type: "boolean", description: "Whether the value may begin with the separator character." } } } }, required: ["type"], additionalProperties: false },
    schema: { type: "object", description: "Options for the `schema` function — validate the value against a JSON Schema.", properties: { schema: { type: "object", description: "The JSON Schema the value must satisfy." }, dialect: { type: "string", description: "JSON Schema dialect to validate with (e.g. `draft7`, `draft2020-12`, or `auto`)." }, allErrors: { type: "boolean", description: "When true, report every schema violation rather than stopping at the first." } }, required: ["schema"] },
    alphabetical: { type: "object", description: "Options for the `alphabetical` function — require array items or object keys to be sorted.", properties: { keyedBy: { type: "string", description: "For arrays of objects, the property whose value items are sorted by. Omit to sort scalars directly." } }, additionalProperties: false },
    xor: { type: "object", description: "Options for the `xor` function — require exactly one of the named properties to be present.", properties: { properties: { type: "array", description: "The set of property names, exactly one of which must be present.", items: { type: "string" } } }, required: ["properties"], additionalProperties: false },
  };
  defs.RuleThen.allOf = defs.RuleThen.allOf || [];
  for (const [fn, opts] of Object.entries(CORE_OPTS)) {
    defs.RuleThen.allOf.push({
      if: { properties: { function: { const: fn } }, required: ["function"] },
      then: { properties: { functionOptions: opts } },
    });
  }

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
        "experience / quality dimension it improves — one of `documentation`, `naming`, " +
        "`consistency`, `security`, `error-handling`, `versioning`, `pagination`, " +
        "`discoverability`, `reliability`, `data-modeling`, `usability`, `governance`, " +
        "`performance`, `observability`), `topic:<feature>` (the cross-cutting feature family it " +
        "belongs to, e.g. `topic:caching`, `topic:rate-limiting`, `topic:tracing`, `topic:cors`, " +
        "`topic:pagination`, `topic:idempotency`, `topic:deprecation`, `topic:conditional-requests`, " +
        "`topic:content-negotiation`), and `owasp:<category>` (the OWASP API Security Top 10 " +
        "category it addresses, e.g. `owasp:api1` … `owasp:api10`). A rule may carry multiple " +
        "tags; tooling groups and filters by them.",
      items: { type: "string" },
      examples: [
        ["format:openapi", "spec:responses", "topic:rate-limiting", "experience:reliability", "experience:performance", "owasp:api4"],
      ],
    };
    // Spotlight extension: `title` — a short Title Case display name (the second Spotlight
    // addition beyond the Spectral baseline, after `tags`).
    ruleProps.title = {
      type: "string",
      description:
        "A short Title Case display name for the rule — the second Spotlight extension beyond " +
        "the Spectral baseline (after `tags`). Conventionally the Title Case form of the rule " +
        "key (e.g. `response-define-429` -> `Response Define 429`). Tooling uses it as the " +
        "human-readable label in rule catalogs and lint output.",
      examples: ["Response Define 429", "Security No HTTP Basic Auth"],
    };
    // Spotlight extension: `reference` — a canonical documentation URL for the rule (the third
    // Spotlight addition beyond the Spectral baseline, after `tags` and `title`).
    ruleProps.reference = {
      type: "string",
      format: "url",
      description:
        "A canonical documentation URL for the rule — the third Spotlight extension beyond the " +
        "Spectral baseline (after `tags` and `title`). Points to the rule's detail page so " +
        "tooling can deep-link from lint output to an explanation. The Spotlight catalog points " +
        "every rule at its page on https://spotlight-rules.com/spec/rules/<artifact>/<slug>/; " +
        "other implementers may point `reference` at their own internal documentation.",
      examples: ["https://spotlight-rules.com/spec/rules/openapi/response-define-429/"],
    };
    // Spotlight extension: `prompt` — an AI fix instruction (the fourth Spotlight addition
    // beyond the Spectral baseline, after `tags`, `title`, and `reference`).
    ruleProps.prompt = {
      type: "string",
      description:
        "A natural-language instruction that an AI assistant (Claude, Gemini, ChatGPT, etc.) can " +
        "apply to FIX a violation of this rule — the fourth Spotlight extension beyond the Spectral " +
        "baseline (after `tags`, `title`, and `reference`). It states the requirement, the precise " +
        "corrective action, and the location, and asks the model to return the corrected artifact. " +
        "Tooling (e.g. the Spotlight validator's Fix action) sends this prompt — together with the " +
        "artifact and the specific lint findings — to a configured model to auto-remediate the rule.",
      examples: [
        "You are editing an OpenAPI document to satisfy the Spotlight rule 'Response Define 429'. Requirement: operations should define a 429 (Too Many Requests) response. To fix: add a `429` response with a description and error schema to each operation that can be rate-limited. Return only the complete corrected document.",
      ],
    };
  }

  // Global ref rewrite across every def and the root.
  for (const d of Object.values(defs)) rewriteRefs(d);

  // Build the root from ruleset.schema, swapping its identity + cross-file refs.
  const out = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
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

  enrich(out);

  // Migrate Spectral's draft-07 constructs to JSON Schema 2020-12: a tuple
  // `items: [...]` becomes `prefixItems`, and `additionalItems` folds into the
  // 2020-12 `items` (schema for the elements past the tuple).
  const migrate = (node) => {
    if (Array.isArray(node)) return node.map(migrate);
    if (node && typeof node === "object") {
      const o = {};
      for (const [k, v] of Object.entries(node)) o[k] = migrate(v);
      if (Array.isArray(o.items)) {
        o.prefixItems = o.items;
        delete o.items;
        if ("additionalItems" in o) {
          if (o.additionalItems !== true) o.items = o.additionalItems;
          delete o.additionalItems;
        }
      } else if ("additionalItems" in o) {
        delete o.additionalItems; // meaningless without a tuple in 2020-12
      }
      return o;
    }
    return node;
  };

  const json = JSON.stringify(migrate(out), null, 2) + "\n";

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
