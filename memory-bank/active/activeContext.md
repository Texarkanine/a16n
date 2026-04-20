# Active Context

## Current Task
Fix plugin-{cursor,claude} docs for complex skills + fix `--rewrite-path-refs` for ride-along resource file references.

## Phase
COMPLEXITY-ANALYSIS - COMPLETE

## What Was Done
- Validated user's intent (docs inaccuracy on complex-skill handling + path-rewriter omission for ride-along resource references).
- Confirmed behavior by reading `plugin-cursor/src/discover.ts`, `plugin-claude/src/discover.ts`, `plugin-claude/src/emit.ts`, and `engine/src/path-rewriter.ts`.
- Complexity: **Level 2** — bug fix across multiple components (docs + engine, with plugin emit touching possible). Some design thought required for the path-rewriter fix ("don't pollute IR or output"), but no architectural implications.

## Next Step
Load Level 2 workflow and enter PLAN phase.
