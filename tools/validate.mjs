#!/usr/bin/env node
// Validate the example rulesets against schema/spotlight-ruleset.schema.json.
//
// Files under examples/ (excluding examples/invalid/) must PASS.
// Files under examples/invalid/ must FAIL.
// Exit code is non-zero if any expectation is unmet, so this doubles as CI.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import ajvErrors from "ajv-errors";
import { parse as parseYaml } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = join(root, "schema", "v1", "spotlight-ruleset.schema.json");
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
ajvErrors(ajv);
const validate = ajv.compile(schema);

function loadDoc(file) {
  const text = readFileSync(file, "utf8");
  // merge: true expands YAML merge keys (<<: *anchor), which Spectral supports.
  return /\.ya?ml$/.test(file) ? parseYaml(text, { merge: true }) : JSON.parse(text);
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ya?ml|json)$/.test(entry)) out.push(full);
  }
  return out;
}

const examplesDir = join(root, "examples");
const invalidDir = join(examplesDir, "invalid");

let failures = 0;
for (const file of walk(examplesDir).sort()) {
  const rel = relative(root, file);
  const expectValid = !file.startsWith(invalidDir);
  let doc;
  try {
    doc = loadDoc(file);
  } catch (err) {
    console.error(`PARSE ERROR  ${rel}: ${err.message}`);
    failures++;
    continue;
  }
  const ok = validate(doc);
  if (ok === expectValid) {
    console.log(`${expectValid ? "PASS (valid)  " : "PASS (invalid)"}  ${rel}`);
  } else {
    failures++;
    if (expectValid) {
      console.error(`FAIL  ${rel} should be VALID but was rejected:`);
      for (const e of validate.errors) {
        console.error(`        ${e.instancePath || "/"} ${e.message}`);
      }
    } else {
      console.error(`FAIL  ${rel} should be INVALID but was accepted.`);
    }
  }
}

console.log(`\n${failures === 0 ? "OK" : "FAILED"} — ${failures} unexpected result(s).`);
process.exit(failures === 0 ? 0 : 1);
