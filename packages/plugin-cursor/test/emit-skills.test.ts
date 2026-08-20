import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type SimpleAgentSkill,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'skills');

describe('Cursor Skills Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('SimpleAgentSkill emission to .cursor/skills/', () => {
    it('should emit SimpleAgentSkill to .cursor/skills/<name>/SKILL.md', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/auth/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'auth-helper',
          sourcePath: '.claude/skills/auth/SKILL.md',
          content: 'Use JWT for authentication.',
          description: 'Authentication patterns',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.written[0]?.type).toBe(CustomizationType.SimpleAgentSkill);

      // Verify skill directory structure
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'auth-helper', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('Use JWT for authentication.');
    });

    it('should include name and description in skill frontmatter', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/db/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'database',
          sourcePath: '.claude/skills/db/SKILL.md',
          content: 'Database operations',
          description: 'Database helper',
          metadata: {},
        },
      ];

      await cursorPlugin.emit(models, tempDir);

      const skillPath = path.join(tempDir, '.cursor', 'skills', 'database', 'SKILL.md');
      const content = await fs.readFile(skillPath, 'utf-8');
      expect(content).toContain('name:');
      expect(content).toContain('description:');
      expect(content).toContain('Database helper');
    });

    it('should sanitize skill names for directory creation', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/weird/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'My Skill (v2)',
          sourcePath: '.claude/skills/weird/SKILL.md',
          content: 'Content',
          description: 'Test',
          metadata: {},
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      // Name should be sanitized
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const entries = await fs.readdir(skillsDir);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toBe('my-skill-v2');
    });
  });

  describe('collision handling', () => {
    it('should not collide between SimpleAgentSkill and ManualPrompt with same name', async () => {
      const models = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.claude/skills/review/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          name: 'review',
          sourcePath: '.claude/skills/review/SKILL.md',
          content: 'Skill content',
          description: 'Review skill',
          metadata: {},
        } as SimpleAgentSkill,
        {
          id: createId(CustomizationType.ManualPrompt, '.cursor/commands/review.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.cursor/commands/review.md',
          content: 'Prompt content',
          promptName: 'review',
          metadata: {},
        } as ManualPrompt,
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);

      // Both now emit to .cursor/skills/ namespace; collision de-dupes the ManualPrompt
      const skillPath = path.join(tempDir, '.cursor', 'skills', 'review', 'SKILL.md');
      const skillContent = await fs.readFile(skillPath, 'utf-8');
      expect(skillContent).toContain('Skill content');

      const manualPath = path.join(tempDir, '.cursor', 'skills', 'review-1', 'SKILL.md');
      const manualContent = await fs.readFile(manualPath, 'utf-8');
      expect(manualContent).toContain('Prompt content');

      // Collision warning emitted (unified skill namespace post-migration)
      const collisionWarnings = result.warnings.filter(w => w.message.includes('collision'));
      expect(collisionWarnings).toHaveLength(1);
    });
  });

  describe('AgentSkills.io spec fields', () => {
    /**
     * `.cursor/skills/<name>/SKILL.md` can carry all four fields, but Cursor does
     * not enforce `allowed-tools`. So everything is written, and only
     * `allowed-tools` warns — fail-closed, because the emitted skill is
     * otherwise quietly more permissive than the source.
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

    async function readDeploySkill(): Promise<string> {
      return fs.readFile(
        path.join(tempDir, '.cursor', 'skills', 'deploy', 'SKILL.md'),
        'utf-8'
      );
    }

    it('should write inert fields verbatim with zero warnings', async () => {
      const result = await cursorPlugin.emit(
        [
          skillWith({
            license: 'Apache-2.0',
            compatibility: 'Requires Node 22+',
            specMetadata: { author: 'Texarkanine' },
          }),
        ],
        tempDir
      );

      const content = await readDeploySkill();
      expect(content).toContain('license: "Apache-2.0"');
      expect(content).toContain('compatibility: "Requires Node 22+"');
      expect(content).toContain('metadata:');
      expect(content).toContain('  "author": "Texarkanine"');
      expect(result.warnings).toEqual([]);
    });

    it('should write allowed-tools AND raise one Skipped warning naming the source', async () => {
      const result = await cursorPlugin.emit(
        [skillWith({ allowedTools: 'Bash(rm:*)' })],
        tempDir
      );

      const content = await readDeploySkill();
      expect(content).toContain('allowed-tools: "Bash(rm:*)"');

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Skipped);
      expect(result.warnings[0]?.message).toContain('allowed-tools');
      // Without sourcePath in sources, --delete-source protection does not engage.
      expect(result.warnings[0]?.sources).toContain('.claude/skills/deploy/SKILL.md');
    });

    it('should raise exactly one warning when all four fields are present', async () => {
      const result = await cursorPlugin.emit(
        [
          skillWith({
            license: 'Apache-2.0',
            compatibility: 'Requires Node 22+',
            specMetadata: { author: 'Texarkanine' },
            allowedTools: 'Bash(rm:*)',
          }),
        ],
        tempDir
      );

      expect(result.warnings).toHaveLength(1);
    });

    it('should write spec fields on a ManualPrompt and warn for allowed-tools', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, '.claude/skills/clean/SKILL.md'),
          type: CustomizationType.ManualPrompt,
          sourcePath: '.claude/skills/clean/SKILL.md',
          content: 'Clean the workspace.',
          promptName: 'clean',
          metadata: {},
          license: 'MIT',
          allowedTools: 'Bash(rm:*)',
        },
      ];

      const result = await cursorPlugin.emit(models, tempDir);

      const content = await fs.readFile(
        path.join(tempDir, '.cursor', 'skills', 'clean', 'SKILL.md'),
        'utf-8'
      );
      expect(content).toContain('license: "MIT"');
      expect(content).toContain('allowed-tools: "Bash(rm:*)"');

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Skipped);
    });
  });
});
