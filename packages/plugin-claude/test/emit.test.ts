import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type GlobalPrompt,
  createId,
} from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a temp directory for emission tests
const tempDir = path.join(__dirname, '.temp-emit-test');

describe('Claude Plugin Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single GlobalPrompt', () => {
    it('should emit a single GlobalPrompt as CLAUDE.md', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Always use TypeScript.',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created
      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('Always use TypeScript.');
    });

    it('should include source header in output', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: '.cursor/rules/test.mdc',
          content: 'Test content',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('.cursor/rules/test.mdc');
    });
  });

  describe('multiple GlobalPrompts', () => {
    it('should merge multiple GlobalPrompts into single CLAUDE.md', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule1.mdc',
          content: 'First rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule2.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule2.mdc',
          content: 'Second rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'rule3.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'rule3.mdc',
          content: 'Third rule',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.itemCount).toBe(3);

      const claudePath = path.join(tempDir, 'CLAUDE.md');
      const content = await fs.readFile(claudePath, 'utf-8');
      expect(content).toContain('First rule');
      expect(content).toContain('Second rule');
      expect(content).toContain('Third rule');
    });

    it('should emit Merged warning when combining multiple sources', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'a.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'a.mdc',
          content: 'A',
          metadata: {},
        },
        {
          id: createId(CustomizationType.GlobalPrompt, 'b.mdc'),
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'b.mdc',
          content: 'B',
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Merged);
      expect(result.warnings[0]?.message).toContain('2');
      expect(result.warnings[0]?.sources).toContain('a.mdc');
      expect(result.warnings[0]?.sources).toContain('b.mdc');
    });
  });

  describe('empty input', () => {
    it('should handle empty models array', async () => {
      const result = await claudePlugin.emit([], tempDir);

      expect(result.written).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);
    });
  });
});
