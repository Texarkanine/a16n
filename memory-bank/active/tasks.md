# Current Task: issue-159-plugin-a16n-unused-vars

**Complexity:** Level 1

## Build

- [x] Locate 9 leftover `eslint(no-unused-vars)` via `pnpm exec oxlint packages/plugin-a16n`
- [x] Remove unused bindings without changing exported behavior
- [x] Re-run oxlint (clean) and `pnpm --filter @a16njs/plugin-a16n test` (111 passed)

### What broke

Oxlint correctness (`no-unused-vars`) reported 9 leftovers in `@a16njs/plugin-a16n`. `oxlint --fix` does not clear them.

### Why

Unused type/value imports and unused local bindings. Not new executable behavior.

### What changed

| File | Change |
| --- | --- |
| `src/index.ts` | Drop unused type imports `AgentCustomization`, `EmitOptions` |
| `src/discover.ts` | Drop unused `extractRelativeDir` import (still re-exported from `index.ts`); omit unused `filepath` |
| `test/parse.test.ts` | Drop unused `CURRENT_IR_VERSION`, `IRVersion` imports |
| `test/emit.test.ts` | `await` two emits that ignored `result` |
| `test/discover.test.ts` | Drop unused type import `AgentCustomization` |

### Files affected

`packages/plugin-a16n/src/discover.ts`, `src/index.ts`, `test/emit.test.ts`, `test/parse.test.ts`, `test/discover.test.ts`
