/**
 * Integration tests: Cursor FileRule and SimpleAgentSkill conversions.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { WarningCode } from '@a16njs/models';
import {
  compareOutputs,
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  readDirFiles,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - FileRule and SimpleAgentSkill', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'filerule-skill');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-filerule-to-claude', () => {
    it('should convert Cursor FileRule to Claude native rule file', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-filerule-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify FileRule was discovered
      const fileRules = result.discovered.filter(d => d.type === 'file-rule');
      expect(fileRules).toHaveLength(1);
      
      // Verify rule file was created in .claude/rules/
      const ruleContent = await fs.readFile(
        path.join(tempDir, '.claude', 'rules', 'react.md'),
        'utf-8'
      );
      expect(ruleContent).toContain('Use React best practices');
      expect(ruleContent).toContain('paths:');
      expect(ruleContent).toContain('**/*.tsx');
      
      // BREAKING: settings.local.json should NOT exist (native rules now)
      await expect(
        fs.access(path.join(tempDir, '.claude', 'settings.local.json'))
      ).rejects.toThrow();
      
      // BREAKING: NO approximation warning (native support now)
      const approxWarning = result.warnings.find(w => w.code === 'approximated');
      expect(approxWarning).toBeUndefined();
    });
  });

  describe('cursor-agentskill-to-claude', () => {
    it('should convert Cursor SimpleAgentSkill to Claude skill', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-agentskill-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify SimpleAgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
      expect(agentSkills).toHaveLength(1);
      
      // Verify skill file was created
      const skillContent = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md'),
        'utf-8'
      );
      // Description is quoted for YAML safety
      expect(skillContent).toContain('description: "Authentication and authorization helper"');
      expect(skillContent).toContain('Use JWT for stateless authentication');
    });
  });

  describe('cursor-skill-paths-refuse-to-claude', () => {
    it('should refuse a Cursor skill with paths: rather than widen scope', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-skill-paths-refuse-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');

      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered.filter(d => d.sourcePath.includes('scoped'))).toHaveLength(0);

      await expect(
        fs.access(path.join(tempDir, '.claude', 'skills', 'scoped', 'SKILL.md'))
      ).rejects.toThrow();

      const warning = result.warnings.find(
        w => w.code === WarningCode.Skipped && w.message.toLowerCase().includes('paths')
      );
      expect(warning).toBeDefined();
      expect(warning?.sources?.some(s => s.includes('scoped'))).toBe(true);
    });
  });

  describe('claude-skill-to-cursor', () => {
    it('should convert Claude skill to Cursor rule with description', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-skill-to-cursor');
      const fromDir = path.join(fixturePath, 'from-claude');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // Verify SimpleAgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
      expect(agentSkills).toHaveLength(1);
      
      // Read the output skill files (Phase 7: SimpleAgentSkill → .cursor/skills/)
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const dirs = await fs.readdir(skillsDir);
      expect(dirs).toHaveLength(1);
      
      const skillContent = await fs.readFile(
        path.join(skillsDir, dirs[0]!, 'SKILL.md'),
        'utf-8'
      );
      expect(skillContent).toContain('description:');
      expect(skillContent).toContain('Testing best practices');
      expect(skillContent).toContain('Write unit tests first');
    });
  });

  describe('claude-spec-fields-to-cursor', () => {
    /**
     * Issue #143 verbatim: a Claude skill carrying all four AgentSkills.io spec
     * fields used to arrive in Cursor with every one of them stripped and no
     * warning. The golden fixture pins the exact frontmatter a user now gets.
     */
    it('should carry all four AgentSkills.io spec fields into the Cursor skill', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-spec-fields-to-cursor');
      await copyDir(path.join(fixturePath, 'from-claude'), tempDir);

      await engine.convert({ source: 'claude', target: 'cursor', root: tempDir });

      const actual = await readDirFiles(path.join(tempDir, '.cursor', 'skills', 'cleanup'));
      const expected = await readDirFiles(
        path.join(fixturePath, 'to-cursor', '.cursor', 'skills', 'cleanup')
      );

      compareOutputs(actual, expected);
    });

    it('should warn that Cursor will not enforce the skill\'s allowed-tools', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-spec-fields-to-cursor');
      await copyDir(path.join(fixturePath, 'from-claude'), tempDir);

      const result = await engine.convert({ source: 'claude', target: 'cursor', root: tempDir });

      // Exactly one warning: the fields that Cursor ignores harmlessly are not
      // losses, so only the unenforced restriction is reported.
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]?.code).toBe(WarningCode.Skipped);
      expect(result.warnings[0]?.message).toContain('allowed-tools');
      expect(result.warnings[0]?.sources).toEqual(['.claude/skills/cleanup/SKILL.md']);
    });
  });

  describe('cursor-skill-names-to-claude', () => {
    it('should preserve skill directory names (invocation names) through conversion', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-skill-names-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');

      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
      expect(agentSkills).toHaveLength(2);

      // Skill directory names should match their original invocation names
      const bananaSkill = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'banana', 'SKILL.md'),
        'utf-8'
      );
      expect(bananaSkill).toContain('Print a banana emoji.');

      const tomatoSkill = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'tomato', 'SKILL.md'),
        'utf-8'
      );
      expect(tomatoSkill).toContain('Print a tomato emoji.');
    });

    it('should discover nested skills under category directories', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-skill-names-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');

      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });

      // Both banana (top-level) and tomato (nested under veggies/) should be discovered
      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
      expect(agentSkills).toHaveLength(2);

      // Verify nested skill identity — tomato originates from veggies/ subdirectory
      const tomatoSkill = agentSkills.find(d => d.sourcePath?.includes('veggies/'));
      expect(tomatoSkill).toBeDefined();
      expect(tomatoSkill?.sourcePath).toContain('tomato');
    });
  });
});
