import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import claudePlugin from '../src/index.js';
import { CustomizationType, WarningCode, type AgentSkill } from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('Claude Plugin Discovery', () => {
  describe('basic CLAUDE.md file', () => {
    it('should discover a single GlobalPrompt from CLAUDE.md', async () => {
      const root = path.join(fixturesDir, 'claude-basic/from-claude');
      const result = await claudePlugin.discover(root);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.items[0]?.sourcePath).toBe('CLAUDE.md');
      expect(result.items[0]?.content).toContain('Always use async/await over promises');
      expect(result.warnings).toHaveLength(0);
    });

    it('should set nested: false for root CLAUDE.md', async () => {
      const root = path.join(fixturesDir, 'claude-basic/from-claude');
      const result = await claudePlugin.discover(root);

      expect(result.items[0]?.metadata).toHaveProperty('nested', false);
      expect(result.items[0]?.metadata).toHaveProperty('depth', 0);
    });
  });

  describe('nested CLAUDE.md files', () => {
    it('should discover all CLAUDE.md files including nested', async () => {
      const root = path.join(fixturesDir, 'claude-nested/from-claude');
      const result = await claudePlugin.discover(root);

      expect(result.items).toHaveLength(2);
      
      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got both files
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('CLAUDE.md');
      expect(sourcePaths).toContain('src/CLAUDE.md');
    });

    it('should mark nested files with correct depth', async () => {
      const root = path.join(fixturesDir, 'claude-nested/from-claude');
      const result = await claudePlugin.discover(root);

      const rootFile = result.items.find(i => i.sourcePath === 'CLAUDE.md');
      const nestedFile = result.items.find(i => i.sourcePath === 'src/CLAUDE.md');

      expect(rootFile?.metadata).toHaveProperty('nested', false);
      expect(rootFile?.metadata).toHaveProperty('depth', 0);
      
      expect(nestedFile?.metadata).toHaveProperty('nested', true);
      expect(nestedFile?.metadata).toHaveProperty('depth', 1);
    });
  });

  describe('empty project', () => {
    it('should return empty items for project with no CLAUDE.md', async () => {
      const root = path.join(fixturesDir, 'claude-empty/from-claude');
      const result = await claudePlugin.discover(root);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});

describe('Claude AgentSkill Discovery (Phase 2)', () => {
  describe('simple skills without hooks', () => {
    it('should discover AgentSkill from .claude/skills/*/SKILL.md', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.AgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.claude/skills/testing/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.AgentSkill) as AgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Testing best practices');
    });

    it('should include skill content in AgentSkill items', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.AgentSkill);
      expect(skill?.content).toContain('Write unit tests first');
    });
  });

  describe('skills with hooks (unsupported)', () => {
    it('should skip skills that contain hooks in frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // No skills should be discovered (the one skill has hooks)
      const skills = result.items.filter(i => i.type === CustomizationType.AgentSkill);
      expect(skills).toHaveLength(0);
    });

    it('should emit warning when skipping skill with hooks', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Skipped);
      expect(result.warnings[0]?.message).toContain('hooks');
      expect(result.warnings[0]?.message).toContain('secure-operations');
    });
  });
});
