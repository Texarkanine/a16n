import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import claudePlugin from '../src/index.js';
import { CustomizationType, WarningCode, type AgentSkill, type AgentIgnore } from '@a16njs/models';

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

describe('Claude AgentIgnore Discovery (Phase 3)', () => {
  describe('settings.json with permissions.deny Read rules', () => {
    it('should discover AgentIgnore from settings.json permissions.deny', async () => {
      const root = path.join(fixturesDir, 'claude-ignore/from-claude');
      const result = await claudePlugin.discover(root);

      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
      expect(agentIgnore).toBeDefined();
      expect(agentIgnore?.sourcePath).toBe('.claude/settings.json');
    });

    it('should convert Read rules to patterns correctly', async () => {
      const root = path.join(fixturesDir, 'claude-ignore/from-claude');
      const result = await claudePlugin.discover(root);

      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore) as AgentIgnore;
      expect(agentIgnore).toBeDefined();
      
      // Read(./.env) → .env
      expect(agentIgnore.patterns).toContain('.env');
      // Read(./dist/**) → dist/
      expect(agentIgnore.patterns).toContain('dist/');
      // Read(./**/*.log) → *.log
      expect(agentIgnore.patterns).toContain('*.log');
      // Read(./secrets/**) → secrets/
      expect(agentIgnore.patterns).toContain('secrets/');
    });

    it('should ignore non-Read rules (Bash, Edit, etc.)', async () => {
      const root = path.join(fixturesDir, 'claude-ignore-mixed/from-claude');
      const result = await claudePlugin.discover(root);

      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore) as AgentIgnore;
      expect(agentIgnore).toBeDefined();
      
      // Should only have patterns from Read rules
      expect(agentIgnore.patterns).toContain('.env');
      expect(agentIgnore.patterns).toContain('secrets/');
      
      // Should NOT have patterns from Bash or Edit rules
      // (Bash(rm:*) and Edit(./package-lock.json) should be ignored)
      expect(agentIgnore.patterns).toHaveLength(2);
    });

    it('should return null for empty deny array', async () => {
      const root = path.join(fixturesDir, 'claude-ignore-empty/from-claude');
      const result = await claudePlugin.discover(root);

      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
      expect(agentIgnore).toBeUndefined();
    });

    it('should handle missing settings.json gracefully', async () => {
      const root = path.join(fixturesDir, 'claude-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Should not crash, just no AgentIgnore
      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
      expect(agentIgnore).toBeUndefined();
    });

    it('should discover both CLAUDE.md and AgentIgnore together', async () => {
      const root = path.join(fixturesDir, 'claude-ignore/from-claude');
      const result = await claudePlugin.discover(root);

      // Should have both GlobalPrompt (from CLAUDE.md) and AgentIgnore (from settings.json)
      const globalPrompt = result.items.find(i => i.type === CustomizationType.GlobalPrompt);
      const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
      
      expect(globalPrompt).toBeDefined();
      expect(agentIgnore).toBeDefined();
    });
  });
});
