# Rule tags — selection taxonomy

The Spotlight ruleset format already supports a `tags` array on every rule (see
[`SPECIFICATION.md`](./SPECIFICATION.md) §3). No new schema field is needed to
select rules by type — `tags` is the mechanism. This document defines a
**convention** so tools (such as
[spotlight-validator](https://github.com/api-commons/spotlight-validator)) can
offer consistent, tag-based rule selection across compiled rulesets.

## Namespaced tags

Tags are namespaced as `namespace:value`. A tool collects the distinct tags and
lets a user filter the active rule set by them.

| Namespace | Meaning | Examples |
| --- | --- | --- |
| `source:` | Where the rule originated (provenance) | `source:sps-commerce`, `source:italia`, `source:adidas` |
| `category:` | What the rule governs | `category:security`, `category:naming`, `category:documentation`, `category:versioning`, `category:pagination`, `category:errors`, `category:structure`, `category:general` |
| `format:` | Which artifact type the rule targets | `format:openapi`, `format:asyncapi`, `format:jsonschema` |

A rule may carry any combination, e.g.:

```yaml
rules:
  sps-commerce/paths-kebab-case:
    given: $.paths[*]~
    severity: warn
    then:
      function: pattern
      functionOptions:
        match: "^(/[a-z0-9-]+)+$"
    tags:
      - source:sps-commerce
      - category:naming
      - format:openapi
```

## Selection semantics

A rule is **active** when:

- no tag filter is applied (all rules active), **or**
- the rule has no tags, **or**
- the rule has at least one tag in the active set (union/OR across selected tags).

This lets a user, for example, enable only `category:security` rules, or only
rules from `source:digitalocean`, or any union of the two.

## Notes

- `tags` is purely additive metadata; it does not affect linting behaviour, only
  discovery/selection by tooling.
- Authors are free to add their own namespaces (e.g. `team:payments`); tools
  should group by namespace and ignore namespaces they don't understand.
