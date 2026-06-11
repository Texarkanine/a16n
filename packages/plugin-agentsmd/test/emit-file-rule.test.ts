import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  createId,
  type FileRule,
  type GlobalPrompt,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'file-rule');

function makeFileRule(globs: string[], overrides: Partial<FileRule> = {}): FileRule {
  const sourcePath = overrides.sourcePath ?? '.cursor/rules/scoped.mdc';
  return {
    id: createId(CustomizationType.FileRule, sourcePath),
    type: CustomizationType.FileRule,
    sourcePath,
    content: 'Scoped instructions.',
    globs,
    metadata: {},
    ...overrides,
  } as FileRule;
}

describe('AGENTS.md Plugin Emission (FileRule)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('directory-shaped globs', () => {
    it('should emit a FileRule with <dir>/** glob to <dir>/AGENTS.md without frontmatter', async () => {
      const rule = makeFileRule(['src/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      const written = result.written[0]!;
      expect(written.path).toBe(path.join(tempDir, 'src', 'AGENTS.md'));
      expect(written.type).toBe(CustomizationType.FileRule);
      expect(written.sourceItems).toEqual([rule]);

      const content = await fs.readFile(written.path, 'utf-8');
      expect(content).toBe('Scoped instructions.\n');
      expect(content).not.toMatch(/^---/);
    });

    it('should accept the <dir>/**/* glob shape', async () => {
      const rule = makeFileRule(['web/**/*']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.path).toBe(path.join(tempDir, 'web', 'AGENTS.md'));
    });

    it('should handle deep directories', async () => {
      const rule = makeFileRule(['packages/foo/src/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.path).toBe(
        path.join(tempDir, 'packages', 'foo', 'src', 'AGENTS.md')
      );
    });
  });

  describe('non-representable globs', () => {
    it('should skip FileRules with extension globs and warn', async () => {
      const rule = makeFileRule(['*.ts']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(0);
      const skipped = result.warnings.filter(w => w.code === WarningCode.Skipped);
      expect(skipped).toHaveLength(1);
      expect(skipped[0]!.sources).toEqual(['.cursor/rules/scoped.mdc']);
    });

    it('should skip FileRules with multiple globs', async () => {
      const rule = makeFileRule(['src/**', 'web/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(1);
    });

    it('should skip FileRules with glob metacharacters in the directory part', async () => {
      const rule = makeFileRule(['src/*/x/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(1);
    });

    it('should skip FileRules whose directory escapes the root', async () => {
      const rule = makeFileRule(['../evil/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(1);
      await expect(fs.access(path.join(tempDir, '..', 'evil'))).rejects.toThrow();
    });

    it('should skip FileRules with absolute-path globs', async () => {
      const rule = makeFileRule(['/etc/**']);

      const result = await agentsmdPlugin.emit([rule], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(1);
    });
  });

  describe('mixed contributors and ordering', () => {
    it('should merge a nested-CLAUDE.md GlobalPrompt and a FileRule targeting the same directory', async () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'src/CLAUDE.md'),
        type: CustomizationType.GlobalPrompt,
        name: 'CLAUDE',
        sourcePath: 'src/CLAUDE.md',
        content: 'From CLAUDE.md.',
        metadata: { nested: true, depth: 1 },
      };
      const rule = makeFileRule(['src/**'], { content: 'From FileRule.' });

      const result = await agentsmdPlugin.emit([gp, rule], tempDir);

      expect(result.written).toHaveLength(1);
      const written = result.written[0]!;
      expect(written.path).toBe(path.join(tempDir, 'src', 'AGENTS.md'));
      expect(written.itemCount).toBe(2);
      expect(written.type).toBe(CustomizationType.GlobalPrompt);

      const content = await fs.readFile(written.path, 'utf-8');
      expect(content).toBe('From CLAUDE.md.\n\nFrom FileRule.\n');
      expect(result.warnings.filter(w => w.code === WarningCode.Merged)).toHaveLength(1);
    });

    it('should write root AGENTS.md first, then directories in sorted order', async () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
        type: CustomizationType.GlobalPrompt,
        name: 'CLAUDE',
        sourcePath: 'CLAUDE.md',
        content: 'Root.',
        metadata: {},
      };
      const ruleB = makeFileRule(['beta/**'], { sourcePath: 'rules/b.mdc' });
      const ruleA = makeFileRule(['alpha/**'], { sourcePath: 'rules/a.mdc' });

      const result = await agentsmdPlugin.emit([ruleB, gp, ruleA], tempDir);

      expect(result.written.map(w => w.path)).toEqual([
        path.join(tempDir, 'AGENTS.md'),
        path.join(tempDir, 'alpha', 'AGENTS.md'),
        path.join(tempDir, 'beta', 'AGENTS.md'),
      ]);
    });
  });
});
