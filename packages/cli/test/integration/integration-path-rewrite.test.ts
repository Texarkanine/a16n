/**
 * Integration tests: path reference rewriting (--rewrite-path-refs).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { WarningCode } from '@a16njs/models';
import {
  createIntegrationEngine,
  fixturesDirFor,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - Path Reference Rewriting (--rewrite-path-refs)', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'path-rewrite');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('Cursor→Claude with rewritePathRefs rewrites .cursor/rules/... → .claude/rules/...', async () => {
    // Create cursor rules that reference each other
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/main.mdc'),
      '---\nalwaysApply: true\n---\n\nLoad: .cursor/rules/auth.mdc\nLoad: .cursor/rules/db.mdc'
    );
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/auth.mdc'),
      '---\nalwaysApply: true\n---\n\nUse JWT for authentication.\nSee also: .cursor/rules/main.mdc'
    );
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/db.mdc'),
      '---\nalwaysApply: true\n---\n\nUse PostgreSQL.'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: tempDir,
      rewritePathRefs: true,
    });

    expect(result.discovered).toHaveLength(3);
    expect(result.written).toHaveLength(3);

    // Read main.md — should have rewritten references
    const mainContent = await fs.readFile(
      path.join(tempDir, '.claude/rules/main.md'),
      'utf-8'
    );
    expect(mainContent).toContain('.claude/rules/auth.md');
    expect(mainContent).toContain('.claude/rules/db.md');
    expect(mainContent).not.toContain('.cursor/rules/auth.mdc');
    expect(mainContent).not.toContain('.cursor/rules/db.mdc');

    // Read auth.md — should have back-reference rewritten
    const authContent = await fs.readFile(
      path.join(tempDir, '.claude/rules/auth.md'),
      'utf-8'
    );
    expect(authContent).toContain('.claude/rules/main.md');
    expect(authContent).not.toContain('.cursor/rules/main.mdc');
  });

  it('Cursor→Claude with rewritePathRefs warns about orphan refs', async () => {
    // Create a cursor rule that references a nonexistent rule
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/main.mdc'),
      '---\nalwaysApply: true\n---\n\nSee .cursor/rules/missing-rule.mdc'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: tempDir,
      rewritePathRefs: true,
    });

    // Should have an OrphanPathRef warning
    const orphanWarnings = result.warnings.filter(w => w.code === WarningCode.OrphanPathRef);
    expect(orphanWarnings.length).toBeGreaterThanOrEqual(1);
    expect(orphanWarnings[0]!.message).toContain('.cursor/rules/missing-rule.mdc');
  });

  it('combined --from-dir + --to-dir + --rewrite-path-refs works end-to-end', async () => {
    const sourceDir = path.join(tempDir, 'source');
    const targetDir = path.join(tempDir, 'target');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });

    // Create rules with cross-references
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/a.mdc'),
      '---\nalwaysApply: true\n---\n\nReference: .cursor/rules/b.mdc'
    );
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/b.mdc'),
      '---\nalwaysApply: true\n---\n\nRule B content'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: '/unused',
      sourceRoot: sourceDir,
      targetRoot: targetDir,
      rewritePathRefs: true,
    });

    expect(result.discovered).toHaveLength(2);
    expect(result.written).toHaveLength(2);

    // Output should be in targetDir
    const aContent = await fs.readFile(
      path.join(targetDir, '.claude/rules/a.md'),
      'utf-8'
    );
    expect(aContent).toContain('.claude/rules/b.md');
    expect(aContent).not.toContain('.cursor/rules/b.mdc');

    // Source should be untouched (no --delete-source)
    await expect(
      fs.access(path.join(sourceDir, '.cursor/rules/a.mdc'))
    ).resolves.not.toThrow();
  });

  it('AgentSkillIO rewrites SKILL.md body and reference ride-alongs', async () => {
    // End-to-end coverage for Behaviors 5–8 of the AgentSkillIO +
    // --rewrite-path-refs fix:
    //   - SKILL.md body references to ride-along resources are rewritten.
    //   - All ride-along files are copied to the target regardless of subtree.
    //   - Content inside scripts/** and references/** is rewritten; content
    //     inside assets/** and unknown subtrees (e.g. data/**) is left
    //     byte-for-byte unchanged.
    //   - Orphan scanning is scoped to scripts/** and references/** only.
    const skillDir = path.join(tempDir, '.cursor', 'skills', 'check');
    await fs.mkdir(path.join(skillDir, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(skillDir, 'references'), { recursive: true });
    await fs.mkdir(path.join(skillDir, 'assets'), { recursive: true });
    await fs.mkdir(path.join(skillDir, 'data'), { recursive: true });

    // SKILL.md references its own ride-along resources.
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      [
        '---',
        'description: Check skill',
        '---',
        '',
        '# Check',
        '',
        'Run the helper: .cursor/skills/check/scripts/helper.sh',
        'See notes: .cursor/skills/check/references/NOTES.md',
        'Raw data blob: .cursor/skills/check/data/blob.bin',
        'Image: .cursor/skills/check/assets/logo.png',
        '',
      ].join('\n'),
    );
    // scripts/helper.sh — content references a sibling script + the SKILL.md
    const scriptBody = [
      '#!/bin/sh',
      '# relies on sibling: .cursor/skills/check/scripts/other.sh',
      '# back-ref to the skill itself: .cursor/skills/check/SKILL.md',
      'exit 0',
      '',
    ].join('\n');
    await fs.writeFile(path.join(skillDir, 'scripts', 'helper.sh'), scriptBody);
    await fs.writeFile(path.join(skillDir, 'scripts', 'other.sh'), '#!/bin/sh\nexit 0\n');
    // references/NOTES.md — referencing a script (should be rewritten).
    const notesBody = [
      '# Notes',
      '',
      'The helper lives at .cursor/skills/check/scripts/helper.sh',
      '',
    ].join('\n');
    await fs.writeFile(path.join(skillDir, 'references', 'NOTES.md'), notesBody);
    // assets/logo.png — must pass through verbatim even if it *looks* like
    // it has a path ref in it. We use a harmless text payload here so
    // we can byte-compare; the guarantee is "asset bytes preserved".
    //
    // The cursor-path fragment below is INTENTIONALLY unmapped (the file
    // `.cursor/rules/missing-from-asset.mdc` doesn't exist in the source
    // tree). If a future regression taught `detectOrphans` to scan assets/,
    // this unmapped ref would show up in an orphan warning — the final
    // assertion in this test pins that behaviour closed.
    const orphanFromAsset = '.cursor/rules/missing-from-asset.mdc';
    const orphanFromData = '.cursor/rules/missing-from-data.mdc';
    const assetBytes =
      `binary-ish payload that happens to mention ${orphanFromAsset}\n`;
    await fs.writeFile(path.join(skillDir, 'assets', 'logo.png'), assetBytes);
    // data/** is an unknown subtree — also must pass through verbatim.
    const dataBody =
      `raw data referencing ${orphanFromData} should not be touched\n`;
    await fs.writeFile(path.join(skillDir, 'data', 'blob.bin'), dataBody);

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: tempDir,
      rewritePathRefs: true,
    });

    // All 5 resource files + SKILL.md should be written.
    const targetSkillDir = path.join(tempDir, '.claude', 'skills', 'check');
    for (const rel of [
      'SKILL.md',
      'scripts/helper.sh',
      'scripts/other.sh',
      'references/NOTES.md',
      'assets/logo.png',
      'data/blob.bin',
    ]) {
      await expect(
        fs.access(path.join(targetSkillDir, rel)),
        `expected ${rel} to be written`,
      ).resolves.not.toThrow();
    }

    // SKILL.md body: cursor → claude paths for known (rewritable) refs;
    // assets/ and data/ refs inside SKILL.md body should ALSO be rewritten
    // (the body is always in scope), the "scope" limitation only applies
    // to content *inside* ride-along files.
    const skillMd = await fs.readFile(path.join(targetSkillDir, 'SKILL.md'), 'utf-8');
    expect(skillMd).toContain('.claude/skills/check/scripts/helper.sh');
    expect(skillMd).toContain('.claude/skills/check/references/NOTES.md');
    expect(skillMd).toContain('.claude/skills/check/data/blob.bin');
    expect(skillMd).toContain('.claude/skills/check/assets/logo.png');
    expect(skillMd).not.toContain('.cursor/skills/check/scripts/helper.sh');
    expect(skillMd).not.toContain('.cursor/skills/check/references/NOTES.md');

    // scripts/helper.sh — rewritten (Behavior 7 allowlist includes scripts/)
    const helper = await fs.readFile(
      path.join(targetSkillDir, 'scripts', 'helper.sh'),
      'utf-8',
    );
    expect(helper).toContain('.claude/skills/check/scripts/other.sh');
    expect(helper).toContain('.claude/skills/check/SKILL.md');
    expect(helper).not.toContain('.cursor/skills/check/scripts/other.sh');
    expect(helper).not.toContain('.cursor/skills/check/SKILL.md');

    // references/NOTES.md — rewritten (Behavior 7 allowlist includes references/)
    const notes = await fs.readFile(
      path.join(targetSkillDir, 'references', 'NOTES.md'),
      'utf-8',
    );
    expect(notes).toContain('.claude/skills/check/scripts/helper.sh');
    expect(notes).not.toContain('.cursor/skills/check/scripts/helper.sh');

    // assets/logo.png — verbatim passthrough (NOT in Behavior 7 allowlist).
    const asset = await fs.readFile(
      path.join(targetSkillDir, 'assets', 'logo.png'),
      'utf-8',
    );
    expect(asset).toBe(assetBytes);
    expect(asset).toContain(orphanFromAsset);

    // data/blob.bin — verbatim passthrough (unknown subtree).
    const data = await fs.readFile(
      path.join(targetSkillDir, 'data', 'blob.bin'),
      'utf-8',
    );
    expect(data).toBe(dataBody);
    expect(data).toContain(orphanFromData);

    // Behavior 8: orphan detection should NOT fire just because assets/
    // or data/ still contain un-rewritten cursor paths. Those subtrees
    // are deliberately out of scope for path scanning.
    //
    // We assert on the *found path* (embedded in the warning message via
    // `Orphan path reference: '${foundPath}' is not in the conversion set`)
    // rather than on the subtree name. The asset/data payloads above contain
    // unmapped cursor paths that WOULD be reported as orphans if their
    // subtrees were scanned; pinning their absence here is a proper
    // regression guard. An assertion on `assets/|data/` would be vacuously
    // true — orphan warnings report the found *path*, not the file that
    // contained it.
    const orphanWarnings = result.warnings.filter(
      (w) => w.code === WarningCode.OrphanPathRef,
    );
    const orphanMessages = orphanWarnings.map((w) => w.message).join('\n');
    expect(
      orphanMessages,
      `unmapped ref inside assets/ leaked into an orphan warning: ${orphanMessages}`,
    ).not.toContain(orphanFromAsset);
    expect(
      orphanMessages,
      `unmapped ref inside data/ leaked into an orphan warning: ${orphanMessages}`,
    ).not.toContain(orphanFromData);
  });
});
