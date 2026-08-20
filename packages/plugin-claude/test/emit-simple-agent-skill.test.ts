import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  type SimpleAgentSkill,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'simple-agent-skill');

describe('Claude SimpleAgentSkill Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('single SimpleAgentSkill', () => {
    it('should create skill directory and SKILL.md file', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should include description in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('---');
      // Description is quoted for YAML safety
      expect(content).toContain('description: "Authentication patterns"');
    });
  });

  describe('multiple SimpleAgentSkills', () => {
    it('should create separate skill directories for each', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Auth content',
          description: 'Auth patterns',
          metadata: {},
        },
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/database.mdc'),
          name: 'database',
          type: CustomizationType.SimpleAgentSkill,
          sourcePath: '.cursor/rules/database.mdc',
          content: 'Database content',
          description: 'Database patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const authPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const dbPath = path.join(tempDir, '.claude', 'skills', 'database', 'SKILL.md');
      
      const authContent = await fs.readFile(authPath, 'utf-8');
      const dbContent = await fs.readFile(dbPath, 'utf-8');
      
      expect(authContent).toContain('Auth content');
      expect(dbContent).toContain('Database content');
    });
  });

  describe('skill name in frontmatter', () => {
    it('should include name from metadata in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: { name: 'Auth Helper' },
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "Auth Helper"');
      expect(content).toContain('description: "Authentication patterns"');
    });

    it('should include skill.name in frontmatter when metadata.name is absent', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name: "auth"');
      expect(content).toContain('description: "Authentication patterns"');
    });
  });

  describe('skill directory naming from name field', () => {
    it('should use skill.name for the output directory when present', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/skills/banana/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          sourcePath: '.cursor/skills/banana/SKILL.md',
          name: 'banana',
          content: 'Print a banana emoji.',
          description: 'Helps you visualize yellow fruits',
          metadata: { name: 'Banana Printer' },
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'banana', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Print a banana emoji.');
      expect(content).toContain('description: "Helps you visualize yellow fruits"');
    });

    it('should use skill.name for output directory', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/auth.mdc'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth',
          sourcePath: '.cursor/rules/auth.mdc',
          content: 'Use JWT.',
          description: 'Auth patterns',
          metadata: {},
        },
      ];

      await claudePlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT.');
    });
  });

  describe('AgentSkills.io spec fields', () => {
    /**
     * Claude natively honours all four spec fields, so emission writes them
     * verbatim and raises no warning — nothing is lost.
     */
    function skillWith(fields: Partial<SimpleAgentSkill>): SimpleAgentSkill {
      return {
        id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/deploy/SKILL.md'),
        type: CustomizationType.SimpleAgentSkill,
        name: 'deploy',
        sourcePath: '.claude/skills/deploy/SKILL.md',
        content: 'Deploy the app.',
        description: 'Deploy patterns',
        metadata: {},
        ...fields,
      };
    }

    async function emitAndRead(skill: SimpleAgentSkill): Promise<string> {
      await claudePlugin.emit([skill], tempDir);
      return fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'deploy', 'SKILL.md'),
        'utf-8'
      );
    }

    it('should write all four spec fields with spec key names', async () => {
      const content = await emitAndRead(
        skillWith({
          license: 'Apache-2.0',
          compatibility: 'Requires Python 3.14+ and uv',
          specMetadata: { author: 'Texarkanine', version: '1.2.0' },
          allowedTools: 'Bash(git:*) Bash(jq:*) Read',
        })
      );

      expect(content).toContain('license: "Apache-2.0"');
      expect(content).toContain('compatibility: "Requires Python 3.14+ and uv"');
      expect(content).toContain('metadata:');
      expect(content).toContain('  "author": "Texarkanine"');
      expect(content).toContain('  "version": "1.2.0"');
      expect(content).toContain('allowed-tools: "Bash(git:*) Bash(jq:*) Read"');

      // Spec key names, never the IR property names.
      expect(content).not.toContain('allowedTools');
      expect(content).not.toContain('specMetadata');
    });

    it('should raise zero warnings when writing spec fields', async () => {
      const result = await claudePlugin.emit(
        [
          skillWith({
            license: 'Apache-2.0',
            compatibility: 'Requires Python 3.14+ and uv',
            specMetadata: { author: 'Texarkanine' },
            allowedTools: 'Bash(rm:*)',
          }),
        ],
        tempDir
      );

      expect(result.warnings).toEqual([]);
    });

    it('should write no stray keys when the spec fields are absent', async () => {
      const content = await emitAndRead(skillWith({}));

      expect(content).not.toContain('license:');
      expect(content).not.toContain('compatibility:');
      expect(content).not.toContain('metadata:');
      expect(content).not.toContain('allowed-tools:');
    });

    it('should survive YAML quoting for a license containing punctuation', async () => {
      const content = await emitAndRead(
        skillWith({ license: 'Proprietary. LICENSE.txt has complete terms' })
      );

      expect(content).toContain('license: "Proprietary. LICENSE.txt has complete terms"');
    });
  });
});

