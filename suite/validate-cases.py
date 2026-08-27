#!/usr/bin/env python3
"""
Check the suite's own integrity.

A conformance suite that nothing checks is in no better position than the compatibility
claims it exists to adjudicate. This does not run any engine - it verifies that every case
is well formed, uniquely identified, and honest about which conformance class it belongs to.

Usage:  python3 suite/validate-cases.py
"""
import glob
import os
import sys

import yaml

ROOT = os.path.dirname(os.path.abspath(__file__))
REQUIRED = ("id", "tier", "spec", "title", "rationale", "expect")
TIERS = {"MUST", "MAY"}
CLASSES = {"validator", "ruleset"}
SEVERITIES = {"error", "warn", "info", "hint", "off"}

failures = []
ids = {}
counts = {"MUST": 0, "MAY": 0}


def fail(path, message):
    failures.append(f"{os.path.relpath(path, ROOT)}: {message}")


for path in sorted(glob.glob(os.path.join(ROOT, "cases", "*", "*.yaml"))):
    try:
        case = yaml.safe_load(open(path, encoding="utf-8"))
    except yaml.YAMLError as exc:
        fail(path, f"does not parse: {exc}")
        continue

    for key in REQUIRED:
        if not case.get(key):
            fail(path, f"missing `{key}`")
    if failures and failures[-1].startswith(os.path.relpath(path, ROOT)):
        continue

    tier = case["tier"]
    if tier not in TIERS:
        fail(path, f"tier `{tier}` is not one of {sorted(TIERS)}")
    else:
        counts[tier] += 1

    # The tier directory and the tier field must agree, so a case cannot be quietly
    # demoted to MAY by moving the file.
    directory = os.path.basename(os.path.dirname(path))
    if directory != tier.lower():
        fail(path, f"sits in cases/{directory}/ but declares tier {tier}")

    if case["id"] in ids:
        fail(path, f"id `{case['id']}` already used by {ids[case['id']]}")
    ids[case["id"]] = os.path.relpath(path, ROOT)

    klass = case.get("class", "validator")
    if klass not in CLASSES:
        fail(path, f"class `{klass}` is not one of {sorted(CLASSES)}")

    expect = case["expect"]
    if klass == "ruleset":
        if expect.get("ruleset") not in ("valid", "invalid"):
            fail(path, "a ruleset-class case must expect `valid` or `invalid`")
        if "document" in case:
            fail(path, "a ruleset-class case must not carry a document - nothing lints it")
    else:
        if "diagnostics" not in expect:
            fail(path, "a validator-class case must expect `diagnostics`")
        if "document" not in case:
            fail(path, "a validator-class case must carry a document")
        for diagnostic in expect.get("diagnostics") or []:
            for key in ("code", "severity", "path"):
                if key not in diagnostic:
                    fail(path, f"a diagnostic is missing `{key}`")
            severity = diagnostic.get("severity")
            if severity not in SEVERITIES:
                fail(path, f"severity `{severity}` must be a name, not {sorted(SEVERITIES)}")
            if not isinstance(diagnostic.get("path"), list):
                fail(path, "a diagnostic `path` must be a list of keys and indices")

    # The rule that matters most: a case has to say which sentence it tests.
    if len((case.get("rationale") or "").split()) < 12:
        fail(path, "rationale is too short to be quoting the specification")

if not ids:
    failures.append("no cases found")

print(f"{len(ids)} cases checked - {counts['MUST']} MUST, {counts['MAY']} MAY")

if failures:
    print("\nProblems:\n")
    for line in failures:
        print(f"  {line}")
    sys.exit(1)

print("Every case is well formed.")
