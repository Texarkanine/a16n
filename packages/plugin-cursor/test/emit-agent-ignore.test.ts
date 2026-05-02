import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type AgentIgnore,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'agent-ignore');

describe('Cursor AgentIgnore Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentIgnore', () => {
    it('should emit AgentIgnore as .cursorignore file', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.claude/settings.json'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.claude/settings.json',
          content: '',
          patterns: ['dist/', '.env', '*.log'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentIgnore);

      // Verify .cursorignore was created
      const ignorePath = path.join(tempDir, '.cursorignore');
      const content = await fs.readFile(ignorePath, 'utf-8');
      expect(content).toContain('dist/');
      expect(content).toContain('.env');
      expect(content).toContain('*.log');
    });

    it('should write patterns one per line with trailing newline', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['a/', 'b/', 'c/'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      expect(content).toBe('a/\nb/\nc/\n');
    });
  });

  describe('multiple AgentIgnores', () => {
    it('should merge multiple AgentIgnores into single .cursorignore', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['build/', '*.log'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      expect(content).toContain('dist/');
      expect(content).toContain('.env');
      expect(content).toContain('build/');
      expect(content).toContain('*.log');
    });

    it('should deduplicate patterns from multiple sources', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['dist/', '*.log'], // dist/ is duplicate
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(path.join(tempDir, '.cursorignore'), 'utf-8');
      const lines = content.trim().split('\n');
      
      // dist/ should only appear once
      expect(lines.filter(l => l === 'dist/').length).toBe(1);
    });

    it('should emit warning when merging multiple AgentIgnores', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source1'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source1',
          content: '',
          patterns: ['dist/'],
          metadata: {},
        },
        {
          id: createId(CustomizationType.AgentIgnore, 'source2'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source2',
          content: '',
          patterns: ['build/'],
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]?.message).toContain('Merged');
      expect(result.warnings[0]?.sources).toContain('source1');
      expect(result.warnings[0]?.sources).toContain('source2');
    });
  });

  describe('mixed with other types', () => {
    it('should emit AgentIgnore alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'global.md',
          name: 'global',
          content: 'Use TypeScript.',
          metadata: {},
        } as GlobalPrompt,
        {
          id: createId(CustomizationType.AgentIgnore, 'ignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'ignore',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        } as AgentIgnore,
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify both files exist
      const rulesExist = await fs.stat(path.join(tempDir, '.cursor', 'rules')).catch(() => null);
      const ignoreExists = await fs.stat(path.join(tempDir, '.cursorignore')).catch(() => null);
      
      expect(rulesExist).not.toBeNull();
      expect(ignoreExists).not.toBeNull();
    });
  });
});
