import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { WarningCode, type Warning } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

/** Warnings raised against a given source path. */
function warningsFor(warnings: Warning[], sourcePath: string): Warning[] {
  return warnings.filter(w => w.sources?.includes(sourcePath));
}

describe('Claude spec-compliance advisory', () => {
  const root = path.join(fixturesDir, 'claude-skills-nonspec/from-claude');

  it('should still discover a skill that uses non-spec features', async () => {
    const result = await claudePlugin.discover(root);

    const deploy = result.items.find(
      i => i.sourcePath === '.claude/skills/deploy/SKILL.md',
    );
    expect(deploy).toBeDefined();
  });

  it('should raise exactly one Approximated warning naming the detected features', async () => {
    const result = await claudePlugin.discover(root);

    const warnings = warningsFor(result.warnings, '.claude/skills/deploy/SKILL.md');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe(WarningCode.Approximated);
    for (const feature of ['argument-hint:', 'model:', '$ARGUMENTS', 'bash injection', '@path']) {
      expect(warnings[0]?.message).toContain(feature);
    }
  });

  it('should word the advisory against the spec, not a destination harness', async () => {
    const result = await claudePlugin.discover(root);

    const message = warningsFor(result.warnings, '.claude/skills/deploy/SKILL.md')[0]?.message ?? '';
    expect(message).toContain('AgentSkills.io');
    expect(message).not.toMatch(/cursor|claude code/i);
  });

  it('should stay silent for a spec-compliant skill', async () => {
    const result = await claudePlugin.discover(root);

    expect(warningsFor(result.warnings, '.claude/skills/clean/SKILL.md')).toHaveLength(0);
  });

  it('should not advise on a skill that was skipped for a missing description', async () => {
    const result = await claudePlugin.discover(root);

    const warnings = warningsFor(result.warnings, '.claude/skills/nameless/SKILL.md');
    expect(warnings).toHaveLength(1);
    expect(warnings[0]?.code).toBe(WarningCode.Skipped);
  });

  it('should not advise on a skill that was skipped for hooks', async () => {
    const hooksRoot = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
    const result = await claudePlugin.discover(hooksRoot);

    expect(result.warnings.filter(w => w.code === WarningCode.Approximated)).toHaveLength(0);
    expect(result.warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(1);
  });
});
