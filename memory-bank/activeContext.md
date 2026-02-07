# Memory Bank: Active Context

## Current Focus

**Task:** Phase 9 Milestone 7 — Documentation & Integration Testing
**Status:** Planning complete, ready for implementation
**Complexity:** Level 3

---

## What We're Building

Final milestone of Phase 9. Three workstreams:

1. **Validation E2E tests** — cross-format round-trips (cursor→a16n→claude, claude→a16n→cursor) + version mismatch warning test
2. **Plugin-a16n docsite pages** — overview + API reference, wired into sidebar/intro, API generation pipeline
3. **Docsite enhancements** — CHANGELOG pages per module, Google Analytics, site verification meta tag

---

## Existing Patterns to Follow

**Plugin docs structure** (see plugin-cursor, plugin-claude):
- `docs/<plugin>/index.md` — overview with sidebar_position, installation, supported files, programmatic usage, See Also
- `docs/<plugin>/api.mdx` — VersionPicker wrapper page

**Sidebar pattern** (see sidebars.js):
```js
{
  type: 'category',
  label: 'Plugin: <Name>',
  items: ['<plugin>/index', { type: 'category', label: 'API Reference', ... }],
}
```

**Integration test pattern** (see integration.test.ts):
- Create source files in tempDir
- Call `engine.convert({ source, target, root: tempDir })`
- Assert on discovered count, written count, content

**API doc generation** (see generate-versioned-api.ts):
- PACKAGES array with `{ name, entryPoint }` 
- WORKSPACE_PACKAGE_PATHS for git checkout consistency
- package.json scripts: `apidoc:current:<pkg>` + pipeline in `apidoc:current`

**Stage script** (see package.json):
- `rm -rf .generated && mkdir -p .generated && cp -r docs/* .generated/`
- Extend to also generate changelog pages from package CHANGELOGs

---

## Key References

| What | Where |
|------|-------|
| Plugin-a16n source | `packages/plugin-a16n/src/` |
| Plugin-a16n README | `packages/plugin-a16n/README.md` |
| Integration tests | `packages/cli/test/integration/integration.test.ts` |
| Docusaurus config | `packages/docs/docusaurus.config.js` |
| Sidebar config | `packages/docs/sidebars.js` |
| Docs package.json | `packages/docs/package.json` |
| API generation script | `packages/docs/scripts/generate-versioned-api.ts` |
| Example plugin docs | `packages/docs/docs/plugin-cursor/index.md` |
| Example API page | `packages/docs/docs/plugin-cursor/api.mdx` |
| Site verification meta | `E9y_GjlmgYsMt4Bjilx2Y201XFZFLyEMn5hQgCXS_z4` |

---

## Immediate Next Steps

1. Write E2E test stubs (A1–A3) — tests first per TDD
2. Implement test bodies
3. Run tests — should pass immediately (functionality exists)
4. Create plugin-a16n doc pages
5. Wire into sidebar + intro + API pipeline
6. CHANGELOG integration + analytics + housekeeping
7. Full verification
