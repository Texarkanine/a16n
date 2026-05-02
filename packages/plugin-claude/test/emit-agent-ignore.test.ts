import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'agent-ignore');

describe('Claude AgentIgnore Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single AgentIgnore', () => {
    it('should emit AgentIgnore as permissions.deny in settings.json', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.cursorignore',
          content: '',
          patterns: ['dist/', '.env', '*.log'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.AgentIgnore);

      // Verify settings.json was created
      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const content = await fs.readFile(settingsPath, 'utf-8');
      const settings = JSON.parse(content);
      
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.deny).toBeInstanceOf(Array);
    });

    it('should convert directory patterns correctly (dist/ → Read(./dist/**))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', 'build/', 'secrets/'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
      expect(settings.permissions.deny).toContain('Read(./build/**)');
      expect(settings.permissions.deny).toContain('Read(./secrets/**)');
    });

    it('should convert glob patterns correctly (*.log → Read(./**/*.log))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['*.log', '*.tmp', '*.bak'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./**/*.log)');
      expect(settings.permissions.deny).toContain('Read(./**/*.tmp)');
      expect(settings.permissions.deny).toContain('Read(./**/*.bak)');
    });

    it('should convert simple file patterns correctly (.env → Read(./.env))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['.env', '.env.local', 'config.json'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./.env)');
      expect(settings.permissions.deny).toContain('Read(./.env.local)');
      expect(settings.permissions.deny).toContain('Read(./config.json)');
    });

    it('should convert double-star patterns correctly (**/*.tmp → Read(./**/*.tmp))', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['**/*.tmp', '**/node_modules/**'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      
      expect(settings.permissions.deny).toContain('Read(./**/*.tmp)');
      expect(settings.permissions.deny).toContain('Read(./**/node_modules/**)');
    });

    it('should emit approximation warning', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
          type: CustomizationType.AgentIgnore,
          sourcePath: '.cursorignore',
          content: '',
          patterns: ['dist/'],
          metadata: {},
        },
      ];

      const result = await claudePlugin.emit(models, tempDir);

      const approxWarning = result.warnings.find(w => w.code === WarningCode.Approximated);
      expect(approxWarning).toBeDefined();
      expect(approxWarning?.message).toContain('permissions.deny');
    });
  });

  describe('merging with existing settings.json', () => {
    it('should merge deny rules with existing settings.json', async () => {
      // Create pre-existing settings.json
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      const existingSettings = {
        permissions: {
          allow: ['Read(./src/**)'],
          deny: ['Read(./existing-deny)'],
        },
        otherSetting: 'preserved',
      };
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(existingSettings, null, 2),
        'utf-8'
      );

      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));

      // Existing settings preserved
      expect(settings.otherSetting).toBe('preserved');
      expect(settings.permissions.allow).toContain('Read(./src/**)');

      // Existing deny rules preserved + new ones added
      expect(settings.permissions.deny).toContain('Read(./existing-deny)');
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
      expect(settings.permissions.deny).toContain('Read(./.env)');
    });

    it('should deduplicate deny rules', async () => {
      const claudeDir = path.join(tempDir, '.claude');
      await fs.mkdir(claudeDir, { recursive: true });
      const existingSettings = {
        permissions: {
          deny: ['Read(./dist/**)'], // Already exists
        },
      };
      await fs.writeFile(
        path.join(claudeDir, 'settings.json'),
        JSON.stringify(existingSettings, null, 2),
        'utf-8'
      );

      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'source'),
          type: CustomizationType.AgentIgnore,
          sourcePath: 'source',
          content: '',
          patterns: ['dist/', '.env'],
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));

      // dist/ should only appear once
      const distCount = settings.permissions.deny.filter((r: string) => r === 'Read(./dist/**)').length;
      expect(distCount).toBe(1);
    });
  });

  describe('mixed with other types', () => {
    it('should emit AgentIgnore alongside GlobalPrompt', async () => {
      const models = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'global.md'),
          type: CustomizationType.GlobalPrompt,
          name: 'global',
          sourcePath: 'global.md',
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

      const result = await claudePlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Verify GlobalPrompt → .claude/rules/global.md
      const globalRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'global.md'), 'utf-8');
      expect(globalRule).toContain('Use TypeScript.');

      // Verify AgentIgnore → .claude/settings.json
      const settingsPath = path.join(tempDir, '.claude', 'settings.json');
      const settings = JSON.parse(await fs.readFile(settingsPath, 'utf-8'));
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
    });
  });
});

