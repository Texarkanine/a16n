import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type SimpleAgentSkill,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'simple-agent-skill');

describe('Cursor SimpleAgentSkill Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single SimpleAgentSkill', () => {
    it('should emit SimpleAgentSkill as .mdc with description: frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.claude/skills/auth/SKILL.md',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.unsupported).toHaveLength(0);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('description:');
      expect(content).toContain('Authentication patterns');
    });

    it('should include skill content after frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'auth.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: 'auth.md',
          content: 'Use JWT for authentication.',
          description: 'Auth patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should quote description with special characters', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'test.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'test',
          sourcePath: 'test.md',
          content: 'Content',
          description: 'Auth: patterns & guidelines',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(result.written[0]!.path, 'utf-8');
      // Description must be double-quoted because it contains YAML special characters (: and &)
      expect(content).toContain('description: "Auth: patterns & guidelines"');
    });
  });
});
