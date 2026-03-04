---
# File-based rule with YAML that regex could not parse
paths:
  - "src/**/*.ts"   # TypeScript only
  - "lib/**/*.js"
---

# YAML edge-case rule

This rule exists to verify proper YAML parsing (e.g. comments, multiple paths).
