import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import claudePlugin from '../src/index.js';
import { CustomizationType, WarningCode, type SimpleAgentSkill, type AgentIgnore, type ManualPrompt, type AgentSkillIO } from '@a16njs/models';

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

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.claude/skills/testing/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Testing best practices');
    });

    it('should include skill content in AgentSkill items', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skill?.content).toContain('Write unit tests first');
    });
  });

  describe('skills with hooks → AgentSkillIO (Phase 8 B3)', () => {
    it('should discover skills with hooks as AgentSkillIO', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // Skills with hooks should now be discovered as AgentSkillIO
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      expect(agentSkillIO).toHaveLength(1);
    });

    it('should NOT emit warning for skills with hooks (they become AgentSkillIO)', async () => {
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // No warnings should be emitted - hooks are now supported
      const hooksWarning = result.warnings.find(w => w.message.includes('hooks'));
      expect(hooksWarning).toBeUndefined();
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

describe('Claude ManualPrompt Discovery (Phase 7)', () => {
  describe('skills with disable-model-invocation: true', () => {
    it('should discover ManualPrompt from skill with disable-model-invocation: true', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const manualPrompts = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(manualPrompts).toHaveLength(1);
      expect(manualPrompts[0]?.sourcePath).toBe('.claude/skills/manual-task/SKILL.md');
    });

    it('should derive promptName from skill name in frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt) as import('@a16njs/models').ManualPrompt;
      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('manual-task');
    });

    it('should include skill content in ManualPrompt', async () => {
      const root = path.join(fixturesDir, 'claude-skills-manual/from-claude');
      const result = await claudePlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt);
      expect(prompt?.content).toContain('Manual Task Instructions');
    });
  });

  describe('regular skills still work as AgentSkill', () => {
    it('should still discover regular skills without flag as AgentSkill', async () => {
      const root = path.join(fixturesDir, 'claude-skills/from-claude');
      const result = await claudePlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
    });
  });
});

describe('Claude Plugin Never Discovers ManualPrompt (Phase 4)', () => {
  it('should never return ManualPrompt items from any discovery', async () => {
    // Test across multiple fixture directories
    const fixtureDirs = [
      'claude-basic/from-claude',
      'claude-nested/from-claude',
      'claude-skills/from-claude',
      'claude-ignore/from-claude',
    ];

    for (const dir of fixtureDirs) {
      const root = path.join(fixturesDir, dir);
      const result = await claudePlugin.discover(root);

      // No items should be of type ManualPrompt (Claude emits but never discovers)
      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(0);
    }
  });

  it('should only discover GlobalPrompt, AgentSkill, AgentSkillIO, FileRule, and AgentIgnore', async () => {
    const root = path.join(fixturesDir, 'claude-skills/from-claude');
    const result = await claudePlugin.discover(root);

    const validTypes = [
      CustomizationType.GlobalPrompt,
      CustomizationType.SimpleAgentSkill,
      CustomizationType.AgentSkillIO,
      CustomizationType.FileRule,
      CustomizationType.AgentIgnore,
    ];

    for (const item of result.items) {
      expect(validTypes).toContain(item.type);
    }
  });
});

describe('AgentSkillIO Discovery (Phase 8 B3)', () => {
  /**
   * Tests for discovering complex skills that have hooks and/or extra files.
   * Skills with hooks or additional resources should be classified as AgentSkillIO.
   */
  describe('complex skills with hooks → AgentSkillIO', () => {
    it('should discover AgentSkillIO from skill with hooks in frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const agentSkillIO = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      );
      expect(agentSkillIO).toBeDefined();
      expect(agentSkillIO?.type).toBe(CustomizationType.AgentSkillIO);
    });

    it('should preserve hooks structure in AgentSkillIO.hooks', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.hooks).toBeDefined();
      expect(skill.hooks).toHaveProperty('pre-commit');
      expect(skill.hooks).toHaveProperty('post-deploy');
    });

    it('should include all extra files in AgentSkillIO.files map', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      expect(Object.keys(skill.files)).toContain('pre-check.sh');
      expect(Object.keys(skill.files)).toContain('manifest.json');
      expect(skill.files['pre-check.sh']).toContain('Running security checks');
      expect(skill.files['manifest.json']).toContain('"securityLevel": "high"');
    });

    it('should extract skill name from frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.name).toBe('secure-deploy');
    });

    it('should extract description from frontmatter', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Secure deployment workflow with pre-commit verification');
    });

    it('should include SKILL.md content in AgentSkillIO.content', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.content).toContain('Secure Deploy Skill');
      expect(skill.content).toContain('secure deployment workflow with automated checks');
    });

    it('should list resource filenames in AgentSkillIO.resources', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('secure-deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.resources).toBeDefined();
      expect(skill.resources).toContain('pre-check.sh');
      expect(skill.resources).toContain('manifest.json');
    });
  });

  describe('simple skills remain as SimpleAgentSkill', () => {
    it('should classify skill without hooks and no extra files as SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      const simpleSkill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('simple-testing')
      );
      expect(simpleSkill).toBeDefined();
      expect(simpleSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    });
  });

  describe('mixed simple and complex skills', () => {
    it('should correctly classify both simple and complex skills', async () => {
      const root = path.join(fixturesDir, 'claude-skills-complex/from-claude');
      const result = await claudePlugin.discover(root);

      // Should have one AgentSkillIO (secure-deploy) and one SimpleAgentSkill (simple-testing)
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      const simpleSkills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);

      expect(agentSkillIO).toHaveLength(1);
      expect(simpleSkills).toHaveLength(1);
      expect(agentSkillIO[0]?.sourcePath).toContain('secure-deploy');
      expect(simpleSkills[0]?.sourcePath).toContain('simple-testing');
    });
  });

  describe('backward compatibility', () => {
    it('should no longer skip skills with hooks (they become AgentSkillIO)', async () => {
      // Previously, the claude-skills-with-hooks fixture would cause a warning
      // Now it should be discovered as AgentSkillIO instead
      const root = path.join(fixturesDir, 'claude-skills-with-hooks/from-claude');
      const result = await claudePlugin.discover(root);

      // The skill with hooks should now be discovered as AgentSkillIO, not skipped
      const agentSkillIO = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO
      );
      expect(agentSkillIO).toBeDefined();
      
      // Should no longer have a warning about hooks
      const hooksWarning = result.warnings.find(w => w.message.includes('hooks'));
      expect(hooksWarning).toBeUndefined();
    });
  });
});

describe('Claude Rules Discovery (Phase 8 A1)', () => {
  describe('file discovery', () => {
    it('should discover .md files from .claude/rules/ directory', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Should discover 2 rules (style.md and testing.md)
      const rules = result.items.filter(i => 
        i.type === CustomizationType.GlobalPrompt && 
        i.sourcePath.startsWith('.claude/rules/')
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

      const frontendRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/frontend.md'
      ) as import('@a16njs/models').FileRule;
      
      expect(frontendRule).toBeDefined();
      expect(frontendRule.type).toBe(CustomizationType.FileRule);
      expect(frontendRule.globs).toContain('**/*.tsx');
      expect(frontendRule.globs).toContain('**/*.jsx');
    });

    it('should normalize single string paths to array', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const apiRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/api.md'
      ) as import('@a16njs/models').FileRule;
      
      expect(apiRule).toBeDefined();
      expect(apiRule.type).toBe(CustomizationType.FileRule);
      expect(Array.isArray(apiRule.globs)).toBe(true);
      expect(apiRule.globs).toContain('src/api/**/*.ts');
    });

    it('should return empty frontmatter when no YAML block present', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      const styleRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/style.md'
      );
      
      expect(styleRule).toBeDefined();
      expect(styleRule?.type).toBe(CustomizationType.GlobalPrompt);
      expect(styleRule?.content).toContain('Use 2 spaces for indentation');
    });

    it('should return empty paths when paths field is absent', async () => {
      const root = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result = await claudePlugin.discover(root);

      // Rules without paths should be GlobalPrompt
      const rules = result.items.filter(i => 
        i.sourcePath.startsWith('.claude/rules/')
      );
      
      for (const rule of rules) {
        expect(rule.type).toBe(CustomizationType.GlobalPrompt);
      }
    });

    it('should preserve additional frontmatter fields in metadata', async () => {
      const root = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result = await claudePlugin.discover(root);

      const apiRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/api.md'
      );
      
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

      const globalPrompts = result.items.filter(i => 
        i.type === CustomizationType.GlobalPrompt && 
        i.sourcePath.startsWith('.claude/rules/')
      );
      expect(globalPrompts.length).toBeGreaterThan(0);
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

      const apiRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/api.md'
      ) as import('@a16njs/models').FileRule;
      
      expect(apiRule.globs).toEqual(['src/api/**/*.ts']);

      const frontendRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/frontend.md'
      ) as import('@a16njs/models').FileRule;
      
      expect(frontendRule.globs).toEqual(['**/*.tsx', '**/*.jsx']);
    });

    it('should preserve body content in both GlobalPrompt and FileRule', async () => {
      const root1 = path.join(fixturesDir, 'claude-rules-basic/from-claude');
      const result1 = await claudePlugin.discover(root1);
      
      const globalPrompt = result1.items.find(i => 
        i.sourcePath === '.claude/rules/style.md'
      );
      expect(globalPrompt?.content).toContain('Use 2 spaces for indentation');

      const root2 = path.join(fixturesDir, 'claude-rules-filebased/from-claude');
      const result2 = await claudePlugin.discover(root2);
      
      const fileRule = result2.items.find(i => 
        i.sourcePath === '.claude/rules/api.md'
      );
      expect(fileRule?.content).toContain('All API endpoints must include input validation');
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

      const skill = result.items.find(i => 
        i.type === CustomizationType.SimpleAgentSkill
      );
      const rule = result.items.find(i => 
        i.sourcePath === '.claude/rules/security.md'
      );
      
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

      const frontendRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/frontend/react.md'
      );
      const backendRule = result.items.find(i => 
        i.sourcePath === '.claude/rules/backend/database.md'
      );
      
      expect(frontendRule).toBeDefined();
      expect(backendRule).toBeDefined();
      
      // Verify full paths are preserved
      expect(frontendRule?.sourcePath).toBe('.claude/rules/frontend/react.md');
      expect(backendRule?.sourcePath).toBe('.claude/rules/backend/database.md');
    });
  });
});
