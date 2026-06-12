import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  createId,
  type GlobalPrompt,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'global-prompt');

function makeGlobalPrompt(overrides: Partial<GlobalPrompt> & { content: string }): GlobalPrompt {
  const sourcePath = overrides.sourcePath ?? 'CLAUDE.md';
  return {
    id: createId(CustomizationType.GlobalPrompt, sourcePath),
    type: CustomizationType.GlobalPrompt,
    name: 'CLAUDE',
    sourcePath,
    metadata: {},
    ...overrides,
  } as GlobalPrompt;
}

describe('AGENTS.md Plugin Emission (GlobalPrompt)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit a single GlobalPrompt to root AGENTS.md', async () => {
      const gp = makeGlobalPrompt({ content: 'Always use TypeScript.' });

      const result = await agentsmdPlugin.emit([gp], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      const written = result.written[0]!;
      expect(written.path).toBe(path.join(tempDir, 'AGENTS.md'));
      expect(written.type).toBe(CustomizationType.GlobalPrompt);
      expect(written.itemCount).toBe(1);
      expect(written.isNewFile).toBe(true);
      expect(written.sourceItems).toEqual([gp]);

      const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toBe('Always use TypeScript.\n');
    });

    it('should ignore relativeDir on GlobalPrompts (always-apply belongs at the root)', async () => {
      const gp = makeGlobalPrompt({
        content: 'Shared conventions.',
        sourcePath: '.cursor/rules/shared/conventions.mdc',
        name: 'conventions',
        relativeDir: 'shared',
      });

      const result = await agentsmdPlugin.emit([gp], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.path).toBe(path.join(tempDir, 'AGENTS.md'));
      await expect(
        fs.access(path.join(tempDir, 'shared', 'AGENTS.md'))
      ).rejects.toThrow();
    });
  });

  describe('multiple GlobalPrompts (concatenation)', () => {
    it('should concatenate multiple GlobalPrompts into one AGENTS.md in input order', async () => {
      const gp1 = makeGlobalPrompt({
        content: 'First rule.',
        sourcePath: 'rules/a.mdc',
        name: 'a',
      });
      const gp2 = makeGlobalPrompt({
        content: 'Second rule.\n',
        sourcePath: 'rules/b.mdc',
        name: 'b',
      });

      const result = await agentsmdPlugin.emit([gp1, gp2], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.itemCount).toBe(2);
      expect(result.written[0]!.sourceItems).toEqual([gp1, gp2]);

      const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(content).toBe('First rule.\n\nSecond rule.\n');
    });

    it('should emit a Merged warning listing all contributing sources', async () => {
      const gp1 = makeGlobalPrompt({ content: 'A', sourcePath: 'a.mdc', name: 'a' });
      const gp2 = makeGlobalPrompt({ content: 'B', sourcePath: 'b.mdc', name: 'b' });

      const result = await agentsmdPlugin.emit([gp1, gp2], tempDir);

      const merged = result.warnings.filter(w => w.code === WarningCode.Merged);
      expect(merged).toHaveLength(1);
      expect(merged[0]!.message).toContain('AGENTS.md');
      expect(merged[0]!.sources).toEqual(['a.mdc', 'b.mdc']);
    });
  });

  describe('nested CLAUDE.md placement (metadata.nested)', () => {
    it('should place a nested-CLAUDE.md-style GlobalPrompt at dirname(sourcePath)/AGENTS.md', async () => {
      const gp = makeGlobalPrompt({
        content: 'Source conventions.',
        sourcePath: 'src/CLAUDE.md',
        metadata: { nested: true, depth: 1 },
      });

      const result = await agentsmdPlugin.emit([gp], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.path).toBe(path.join(tempDir, 'src', 'AGENTS.md'));

      const content = await fs.readFile(path.join(tempDir, 'src', 'AGENTS.md'), 'utf-8');
      expect(content).toBe('Source conventions.\n');
    });

    it('should fall back to root AGENTS.md when nested metadata has no sourcePath', async () => {
      const gp = makeGlobalPrompt({ content: 'Orphaned nested prompt.' });
      delete gp.sourcePath;
      gp.metadata = { nested: true, depth: 1 };

      const result = await agentsmdPlugin.emit([gp], tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.path).toBe(path.join(tempDir, 'AGENTS.md'));
    });
  });

  describe('dry run', () => {
    it('should report writes without touching the filesystem', async () => {
      const gp = makeGlobalPrompt({ content: 'Dry run content.' });

      const result = await agentsmdPlugin.emit([gp], tempDir, { dryRun: true });

      expect(result.written).toHaveLength(1);
      expect(result.written[0]!.isNewFile).toBe(true);
      await expect(fs.access(path.join(tempDir, 'AGENTS.md'))).rejects.toThrow();
    });
  });

  describe('empty input', () => {
    it('should handle an empty models array', async () => {
      const result = await agentsmdPlugin.emit([], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);
    });
  });
});
