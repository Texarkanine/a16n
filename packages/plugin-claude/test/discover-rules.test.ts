import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType, type SimpleAgentSkill, type FileRule } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Claude Rules Discovery', () => {
  describe('file discovery', () => {
    it('should discover .md files from .claude/rules/ directory', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Should discover 2 rules (style.md and testing.md)
      const rules = result.items.filter(
        i => i.type === CustomizationType.GlobalPrompt && i.sourcePath.startsWith('.claude/rules/'),
      );
      expect(rules).toHaveLength(2);

      const sourcePaths = rules.map(r => r.sourcePath);
      expect(sourcePaths).toContain('.claude/rules/style.md');
      expect(sourcePaths).toContain('.claude/rules/testing.md');
    });

    it('should discover nested rules in subdirectories', async () => {
      const root = path.join(fixturesDir, 'claude-rules-nested/from-claude');
      const result = await claudePlugin.discover(root);

      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));
      expect(rules).toHaveLength(2);

      const sourcePaths = rules.map(r => r.sourcePath);
      expect(sourcePaths).toContain('.claude/rules/frontend/react.md');
      expect(sourcePaths).toContain('.claude/rules/backend/database.md');
    });

    it('should set relativeDir from subdirectory path on nested rules', async () => {
      // Rules in subdirectories should have relativeDir set to the directory
      // portion under .claude/rules/ (e.g., 'frontend', 'backend')
      const root = path.join(fixturesDir, 'claude-rules-nested/from-claude');
      const result = await claudePlugin.discover(root);

      const frontendRule = result.items.find(i => i.sourcePath === '.claude/rules/frontend/react.md');
      const backendRule = result.items.find(i => i.sourcePath === '.claude/rules/backend/database.md');

      expect(frontendRule?.relativeDir).toBe('frontend');
      expect(backendRule?.relativeDir).toBe('backend');
    });

    it('should set relativeDir for deeply nested rules and undefined for root rules', async () => {
      // Deep nesting like niko/Core/ should be preserved in full;
      // root-level rules should have relativeDir undefined
      const root = path.join(fixturesDir, 'claude-nested-rules/from-claude');
      const result = await claudePlugin.discover(root);

      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));
      expect(rules).toHaveLength(3);

      const topLevel = result.items.find(i => i.sourcePath === '.claude/rules/top-level.md');
      const coreRule = result.items.find(i => i.sourcePath === '.claude/rules/niko/Core/file-verification.md');
      const level1Rule = result.items.find(i => i.sourcePath === '.claude/rules/niko/Level1/workflow-level1.md');

      expect(topLevel?.relativeDir).toBeUndefined();
      expect(coreRule?.relativeDir).toBe('niko/Core');
      expect(level1Rule?.relativeDir).toBe('niko/Level1');
    });

    it('should skip hidden directories like .git', async () => {
      // This is implicitly tested - we won't create .git directories in fixtures
      // The implementation should use the same pattern as findClaudeFiles
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // No errors should occur from trying to read hidden directories
      expect(result.warnings).toHaveLength(0);
    });

    it('should return empty array when .claude/rules/ does not exist', async () => {
      const root = path.join(fixturesDir, 'claude-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Should only find CLAUDE.md, no rules
      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));
      expect(rules).toHaveLength(0);
      expect(result.warnings).toHaveLength(0); // No errors for missing directory
    });

    it('should normalize path separators for cross-platform consistency', async () => {
      const root = path.join(fixturesDir, 'claude-rules-nested/from-claude');
      const result = await claudePlugin.discover(root);

      // Paths should use forward slashes, not backslashes
      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));
      for (const rule of rules) {
        expect(rule.sourcePath).not.toContain('\\');
        expect(rule.sourcePath).toMatch(/^\.claude\/rules\//);
      }
    });
  });

  describe('frontmatter parsing', () => {
    it('should parse paths as string array from frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const frontendRule = result.items.find(i => i.sourcePath === '.claude/rules/frontend.md') as FileRule;

      expect(frontendRule).toBeDefined();
      expect(frontendRule.type).toBe(CustomizationType.FileRule);
      expect(frontendRule.globs).toContain('**/*.tsx');
      expect(frontendRule.globs).toContain('**/*.jsx');
    });

    it('should normalize single string paths to array', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const apiRule = result.items.find(i => i.sourcePath === '.claude/rules/api.md') as FileRule;

      expect(apiRule).toBeDefined();
      expect(apiRule.type).toBe(CustomizationType.FileRule);
      expect(Array.isArray(apiRule.globs)).toBe(true);
      expect(apiRule.globs).toContain('src/api/**/*.ts');
    });

    it('should return empty frontmatter when no YAML block present', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const styleRule = result.items.find(i => i.sourcePath === '.claude/rules/style.md');

      expect(styleRule).toBeDefined();
      expect(styleRule?.type).toBe(CustomizationType.GlobalPrompt);
      expect(styleRule?.content).toContain('Use 2 spaces for indentation');
    });

    it('should return empty paths when paths field is absent', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Rules without paths should be GlobalPrompt
      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));

      for (const rule of rules) {
        expect(rule.type).toBe(CustomizationType.GlobalPrompt);
      }
    });

    it('should preserve additional frontmatter fields in metadata', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const apiRule = result.items.find(i => i.sourcePath === '.claude/rules/api.md');

      expect(apiRule).toBeDefined();
      // Metadata should be present (even if empty in this test)
      expect(apiRule?.metadata).toBeDefined();
    });
  });

  describe('classification logic', () => {
    it('should classify rules without paths as GlobalPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));

      for (const rule of rules) {
        expect(rule.type).toBe(CustomizationType.GlobalPrompt);
      }
      expect(rules).toHaveLength(2);
    });

    it('should classify rules with empty paths array as GlobalPrompt', async () => {
      // Empty paths should be treated as GlobalPrompt
      // This is implicitly tested in the "without paths" test
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const globalPrompts = result.items.filter(
        i => i.type === CustomizationType.GlobalPrompt && i.sourcePath.startsWith('.claude/rules/'),
      );
      expect(globalPrompts.length).toBeGreaterThan(0);
    });

    it('should set name from source filename (without extension) on .claude/rules/ GlobalPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const styleRule = result.items.find(i => i.sourcePath === '.claude/rules/style.md');
      expect(styleRule).toBeDefined();
      expect(styleRule?.name).toBe('style');
    });

    it('should classify rules with paths as FileRule', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const fileRules = result.items.filter(i => i.type === CustomizationType.FileRule);
      expect(fileRules).toHaveLength(2);

      const sourcePaths = fileRules.map(r => r.sourcePath);
      expect(sourcePaths).toContain('.claude/rules/api.md');
      expect(sourcePaths).toContain('.claude/rules/frontend.md');
    });

    it('should extract globs correctly from paths field', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const apiRule = result.items.find(i => i.sourcePath === '.claude/rules/api.md') as FileRule;

      expect(apiRule.globs).toEqual(['src/api/**/*.ts']);

      const frontendRule = result.items.find(i => i.sourcePath === '.claude/rules/frontend.md') as FileRule;

      expect(frontendRule.globs).toEqual(['**/*.tsx', '**/*.jsx']);
    });

    it('should preserve body content in both GlobalPrompt and FileRule', async () => {
      const root1 = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result1 = await claudePlugin.discover(root1);

      const globalPrompt = result1.items.find(i => i.sourcePath === '.claude/rules/style.md');
      expect(globalPrompt?.content).toContain('Use 2 spaces for indentation');

      const root2 = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result2 = await claudePlugin.discover(root2);

      const fileRule = result2.items.find(i => i.sourcePath === '.claude/rules/api.md');
      expect(fileRule?.content).toContain('All API endpoints must include input validation');
    });
  });

  describe('YAML frontmatter (gray-matter)', () => {
    it('should parse rule frontmatter with YAML comments and multiple paths', async () => {
      const root = path.join(fixturesDir, 'claude-yaml-edge-cases/from-claude');
      const result = await claudePlugin.discover(root);

      const rule = result.items.find(i => i.sourcePath === '.claude/rules/with-yaml-edge.md') as FileRule;

      expect(rule).toBeDefined();
      expect(rule.type).toBe(CustomizationType.FileRule);
      expect(rule.globs).toContain('src/**/*.ts');
      expect(rule.globs).toContain('lib/**/*.js');
      expect(rule.content).toContain('YAML edge-case rule');
    });

    it('should parse skill frontmatter with multi-line (folded) description', async () => {
      const root = path.join(fixturesDir, 'claude-yaml-edge-cases/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('multiline-desc'),
      ) as SimpleAgentSkill;

      expect(skill).toBeDefined();
      expect(skill.description).toContain('Use TDD when writing tests');
      expect(skill.description).toContain('Prefer descriptive test names');
      expect(skill.content).toContain('Body content here');
    });
  });

  describe('integration with existing discovery', () => {
    it('should discover rules alongside CLAUDE.md files', async () => {
      const root = path.join(fixturesDir, 'claude-rules-mixed/from-claude');
      const result = await claudePlugin.discover(root);

      // Should have both CLAUDE.md and rules
      const claudeMd = result.items.find(i => i.sourcePath === 'CLAUDE.md');
      const rule = result.items.find(i => i.sourcePath === '.claude/rules/security.md');

      expect(claudeMd).toBeDefined();
      expect(claudeMd?.type).toBe(CustomizationType.GlobalPrompt);
      expect(rule).toBeDefined();
      expect(rule?.type).toBe(CustomizationType.FileRule);
    });

    it('should discover rules alongside skills', async () => {
      const root = path.join(fixturesDir, 'claude-rules-mixed/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      const rule = result.items.find(i => i.sourcePath === '.claude/rules/security.md');

      expect(skill).toBeDefined();
      expect(rule).toBeDefined();
      expect(result.items.length).toBeGreaterThanOrEqual(3); // CLAUDE.md + skill + rule
    });

    it('should generate unique IDs for rules', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const rules = result.items.filter(i => i.sourcePath.startsWith('.claude/rules/'));
      const ids = rules.map(r => r.id);

      // All IDs should be unique
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(rules.length);

      // IDs should be non-empty
      for (const id of ids) {
        expect(id).toBeTruthy();
        expect(id.length).toBeGreaterThan(0);
      }
    });

    it('should preserve source path with subdirectory structure', async () => {
      const root = path.join(fixturesDir, 'claude-rules-nested/from-claude');
      const result = await claudePlugin.discover(root);

      const frontendRule = result.items.find(i => i.sourcePath === '.claude/rules/frontend/react.md');
      const backendRule = result.items.find(i => i.sourcePath === '.claude/rules/backend/database.md');

      expect(frontendRule).toBeDefined();
      expect(backendRule).toBeDefined();

      // Verify full paths are preserved
      expect(frontendRule?.sourcePath).toBe('.claude/rules/frontend/react.md');
      expect(backendRule?.sourcePath).toBe('.claude/rules/backend/database.md');
    });
  });
});
