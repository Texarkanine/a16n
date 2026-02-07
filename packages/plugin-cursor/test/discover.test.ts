import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import { CustomizationType, WarningCode, type ManualPrompt, type AgentSkillIO } from '@a16njs/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('Cursor Plugin Discovery', () => {
  describe('basic .mdc file', () => {
    it('should discover a single GlobalPrompt from alwaysApply: true rule', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.items[0]?.sourcePath).toBe('.cursor/rules/general.mdc');
      expect(result.items[0]?.content).toContain('Use TypeScript for all new files');
      expect(result.items[0]?.content).toContain('Prefer functional components');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('multiple .mdc files', () => {
    it('should discover all GlobalPrompt items from multiple files', async () => {
      const root = path.join(fixturesDir, 'cursor-multiple/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(3);
      
      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/style.mdc');
      expect(sourcePaths).toContain('.cursor/rules/testing.mdc');
      expect(sourcePaths).toContain('.cursor/rules/patterns.mdc');
    });
  });

  describe('empty project', () => {
    it('should return empty items for project with no rules', async () => {
      const root = path.join(fixturesDir, 'cursor-empty/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('nested subdirectories', () => {
    it('should discover rules in subdirectories like shared/ and local/', async () => {
      const root = path.join(fixturesDir, 'cursor-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should find 3 rules: root.mdc, shared/core.mdc, local/project.mdc
      expect(result.items).toHaveLength(3);

      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files with correct paths
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/root.mdc');
      expect(sourcePaths).toContain('.cursor/rules/shared/core.mdc');
      expect(sourcePaths).toContain('.cursor/rules/local/project.mdc');
    });
  });
});

describe('MDC Parsing', () => {
  it('should parse frontmatter correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    expect(item?.metadata).toHaveProperty('alwaysApply', true);
  });

  it('should extract body content without frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    // Content should not include the frontmatter delimiters
    expect(item?.content).not.toContain('---');
    expect(item?.content).not.toContain('alwaysApply');
  });
});

describe('FileRule Discovery (Phase 2)', () => {
  it('should discover FileRule items from rules with globs: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);
    
    // All should be FileRule
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should parse single glob pattern correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const tsRule = result.items.find(i => i.sourcePath.includes('typescript'));
    expect(tsRule).toBeDefined();
    expect(tsRule?.type).toBe(CustomizationType.FileRule);
    expect((tsRule as import('@a16njs/models').FileRule).globs).toEqual(['**/*.ts']);
  });

  it('should parse comma-separated glob patterns into array', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule).toBeDefined();
    expect(reactRule?.type).toBe(CustomizationType.FileRule);
    expect((reactRule as import('@a16njs/models').FileRule).globs).toEqual(['**/*.tsx', '**/*.jsx']);
  });

  it('should include rule content in FileRule items', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule?.content).toContain('Use React best practices');
  });
});

describe('SimpleAgentSkill Discovery (Phase 2)', () => {
  it('should discover SimpleAgentSkill items from rules with description: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);
    
    // All should be SimpleAgentSkill
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.SimpleAgentSkill);
    }
  });

  it('should extract description from frontmatter without quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill).toBeDefined();
    expect(authSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((authSkill as import('@a16njs/models').SimpleAgentSkill).description).toBe('Authentication and authorization patterns');
  });

  it('should extract description from frontmatter with quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const dbSkill = result.items.find(i => i.sourcePath.includes('database'));
    expect(dbSkill).toBeDefined();
    expect(dbSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((dbSkill as import('@a16njs/models').SimpleAgentSkill).description).toBe('Database operations and ORM usage');
  });

  it('should include rule content in SimpleAgentSkill items', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill?.content).toContain('Use JWT for stateless authentication');
  });
});

describe('Classification Priority (Phase 2)', () => {
  it('should prioritize alwaysApply: true as GlobalPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
  });

  it('should classify rules with globs as FileRule', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should classify rules with description (no globs) as SimpleAgentSkill', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.SimpleAgentSkill);
    }
  });

  it('should classify rules with empty globs: and description as SimpleAgentSkill (not FileRule)', async () => {
    const root = path.join(fixturesDir, 'cursor-empty-globs-with-description/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect((result.items[0] as import('@a16njs/models').SimpleAgentSkill).description).toBe('when to do a thing properly');
  });

  it('should classify rules with valid globs over description (globs takes precedence)', async () => {
    // This test verifies no regression - rules with both globs and description should be FileRule
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    // FileRules in this fixture have globs, should NOT become AgentSkill
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should classify rules without activation criteria as ManualPrompt (Phase 7)', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    // Both rules should be ManualPrompt (no alwaysApply, no globs, no description)
    expect(result.items).toHaveLength(2);
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.ManualPrompt);
    }
  });

  it('should derive promptName from filename for ManualPrompt rules', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const helperPrompt = result.items.find(
      i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'helper'
    );
    expect(helperPrompt).toBeDefined();
    expect(helperPrompt?.sourcePath).toBe('.cursor/rules/helper.mdc');
  });

  it('should classify rules with alwaysApply: false and no other criteria as ManualPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const helperPrompt = result.items.find(i => i.sourcePath.includes('helper'));
    expect(helperPrompt).toBeDefined();
    expect(helperPrompt?.type).toBe(CustomizationType.ManualPrompt);
  });

  it('should classify rules with no frontmatter as ManualPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-rule-no-criteria/from-cursor');
    const result = await cursorPlugin.discover(root);

    const noFrontmatterPrompt = result.items.find(i => i.sourcePath.includes('no-frontmatter'));
    expect(noFrontmatterPrompt).toBeDefined();
    expect(noFrontmatterPrompt?.type).toBe(CustomizationType.ManualPrompt);
  });
});

describe('AgentIgnore Discovery (Phase 3)', () => {
  it('should discover AgentIgnore from .cursorignore file', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeDefined();
    expect(agentIgnore?.sourcePath).toBe('.cursorignore');
  });

  it('should parse patterns from .cursorignore (ignoring comments and blanks)', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore) as import('@a16njs/models').AgentIgnore;
    expect(agentIgnore).toBeDefined();
    
    // Should have patterns, not comments
    expect(agentIgnore.patterns).toContain('dist/');
    expect(agentIgnore.patterns).toContain('build/');
    expect(agentIgnore.patterns).toContain('.env');
    expect(agentIgnore.patterns).toContain('.env.local');
    expect(agentIgnore.patterns).toContain('*.log');
    expect(agentIgnore.patterns).toContain('secrets/');
    
    // Should not include comments
    expect(agentIgnore.patterns).not.toContain('# Build output');
  });

  it('should return null for empty .cursorignore', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore-empty/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeUndefined();
  });

  it('should return null for comments-only .cursorignore', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore-comments/from-cursor');
    const result = await cursorPlugin.discover(root);

    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    expect(agentIgnore).toBeUndefined();
  });

  it('should discover both rules and AgentIgnore together', async () => {
    const root = path.join(fixturesDir, 'cursor-ignore/from-cursor');
    const result = await cursorPlugin.discover(root);

    // Should have both GlobalPrompt (from .mdc) and AgentIgnore (from .cursorignore)
    const globalPrompt = result.items.find(i => i.type === CustomizationType.GlobalPrompt);
    const agentIgnore = result.items.find(i => i.type === CustomizationType.AgentIgnore);
    
    expect(globalPrompt).toBeDefined();
    expect(agentIgnore).toBeDefined();
  });
});

describe('Cursor Skills Discovery (Phase 7)', () => {
  describe('skills with description → SimpleAgentSkill', () => {
    it('should discover SimpleAgentSkill from .cursor/skills/*/SKILL.md with description', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.cursor/skills/deploy/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Helps with deploying services to production');
    });

    it('should use name from frontmatter in metadata', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skill?.metadata?.name).toBe('deploy-service');
    });
  });

  describe('skills with disable-model-invocation → ManualPrompt', () => {
    it('should discover ManualPrompt from skill with disable-model-invocation: true', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const manualPrompts = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(manualPrompts).toHaveLength(1);
      expect(manualPrompts[0]?.sourcePath).toBe('.cursor/skills/reset-db/SKILL.md');
    });

    it('should derive promptName from skill name in frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt) as ManualPrompt;
      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('reset-db');
    });
  });

  describe('skills without description or disable-model-invocation → skip', () => {
    it('should skip skill without description or disable-model-invocation and emit warning', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not be discovered as any type
      const invalidSkill = result.items.find(i => i.sourcePath.includes('invalid-skill'));
      expect(invalidSkill).toBeUndefined();

      // Should have warning
      const warning = result.warnings.find(w => w.message.includes('invalid-skill'));
      expect(warning).toBeDefined();
      expect(warning?.code).toBe(WarningCode.Skipped);
    });
  });

  describe('missing .cursor/skills/ directory', () => {
    it('should handle missing skills directory gracefully', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not crash, just no skills
      const skills = result.items.filter(
        i => i.type === CustomizationType.SimpleAgentSkill || 
             (i.type === CustomizationType.ManualPrompt && i.sourcePath.includes('skills'))
      );
      expect(skills).toHaveLength(0);
    });
  });
});

describe('ManualPrompt Discovery (Phase 4 - Commands)', () => {
  describe('simple commands', () => {
    it('should discover simple commands from .cursor/commands/', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(2);
    });

    it('should extract promptName from filename', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'review'
      );
      expect(reviewCommand).toBeDefined();
      expect(reviewCommand?.sourcePath).toBe('.cursor/commands/review.md');
    });

    it('should include command content', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'review'
      ) as ManualPrompt;
      expect(reviewCommand.content).toContain('Security vulnerabilities');
      expect(reviewCommand.content).toContain('Performance issues');
    });

    it('should discover commands alongside rules', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const globalPrompt = result.items.find(i => i.type === CustomizationType.GlobalPrompt);
      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);

      expect(globalPrompt).toBeDefined();
      expect(commands).toHaveLength(2);
    });
  });

  describe('complex commands (skipped)', () => {
    it('should skip commands with $ARGUMENTS', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const fixIssueCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'fix-issue'
      );
      expect(fixIssueCommand).toBeUndefined();

      const warning = result.warnings.find(w => w.message.includes('fix-issue'));
      expect(warning).toBeDefined();
      expect(warning?.code).toBe(WarningCode.Skipped);
      expect(warning?.message).toContain('$ARGUMENTS');
    });

    it('should skip commands with positional parameters ($1, $2)', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const prReviewCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'pr-review'
      );
      expect(prReviewCommand).toBeUndefined();

      const warning = result.warnings.find(w => w.message.includes('pr-review'));
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('$ARGUMENTS');
    });

    it('should skip commands with bash execution (!)', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const deployCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'deploy'
      );
      expect(deployCommand).toBeUndefined();

      const warning = result.warnings.find(w => w.message.includes('deploy'));
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('bash execution');
    });

    it('should skip commands with file references (@)', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const analyzeCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'analyze'
      );
      expect(analyzeCommand).toBeUndefined();

      const warning = result.warnings.find(w => w.message.includes('analyze'));
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('file references');
    });

    it('should skip commands with allowed-tools frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const secureCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'secure'
      );
      expect(secureCommand).toBeUndefined();

      const warning = result.warnings.find(w => w.message.includes('secure'));
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('allowed-tools');
    });
  });

  describe('mixed commands', () => {
    it('should discover simple commands and skip complex ones', async () => {
      const root = path.join(fixturesDir, 'cursor-command-mixed/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(1);
      expect((commands[0] as ManualPrompt).promptName).toBe('simple');

      const warning = result.warnings.find(w => w.message.includes('complex'));
      expect(warning).toBeDefined();
    });
  });

  describe('nested commands', () => {
    it('should discover commands in subdirectories', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(2);

      const promptNames = commands.map(c => (c as ManualPrompt).promptName);
      expect(promptNames).toContain('component');
      expect(promptNames).toContain('api');
    });

    it('should include nested path in sourcePath', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const componentCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'component'
      );
      expect(componentCommand?.sourcePath).toBe('.cursor/commands/frontend/component.md');
    });

    it('should set relativeDir from directory nesting to avoid name collisions', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const componentCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'component'
      ) as ManualPrompt;
      const apiCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'api'
      ) as ManualPrompt;

      expect(componentCommand.relativeDir).toBe('frontend');
      expect(apiCommand.relativeDir).toBe('backend');
    });
  });

  describe('no commands', () => {
    it('should return no commands for project without .cursor/commands/', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(commands).toHaveLength(0);
    });
  });
});

describe('AgentSkillIO Discovery (Phase 8 B3)', () => {
  /**
   * Tests for discovering complex skills that have extra files in their directory.
   * Skills with additional resources (checklist.md, config.json, etc.) should be
   * classified as AgentSkillIO instead of SimpleAgentSkill.
   */
  describe('complex skills with extra files → AgentSkillIO', () => {
    it('should discover AgentSkillIO from skill with extra files', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const agentSkillIO = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      );
      expect(agentSkillIO).toBeDefined();
      expect(agentSkillIO?.type).toBe(CustomizationType.AgentSkillIO);
    });

    it('should include all extra files in AgentSkillIO.files map', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      expect(Object.keys(skill.files)).toContain('checklist.md');
      expect(Object.keys(skill.files)).toContain('config.json');
      expect(skill.files['checklist.md']).toContain('Pre-Deployment Checklist');
      expect(skill.files['config.json']).toContain('"environment": "production"');
    });

    it('should extract skill name from frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.name).toBe('deploy-service');
    });

    it('should extract description from frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Helps deploy services to production with checklists and scripts');
    });

    it('should include SKILL.md content in AgentSkillIO.content', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;
      
      expect(skill).toBeDefined();
      expect(skill.content).toContain('Deploy Service Skill');
      expect(skill.content).toContain('Refer to the included resources for guidance');
    });

    it('should list resource filenames in AgentSkillIO.resources', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.resources).toBeDefined();
      expect(skill.resources).toContain('checklist.md');
      expect(skill.resources).toContain('config.json');
      expect(skill.resources).toContain('scripts/deploy.sh');
    });

    it('should recursively read files in subdirectories (scripts/, references/, etc.)', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(
        i => i.type === CustomizationType.AgentSkillIO && i.sourcePath.includes('deploy')
      ) as AgentSkillIO;

      expect(skill).toBeDefined();
      expect(skill.files).toBeDefined();
      // Subdirectory file should be keyed with relative path
      expect(Object.keys(skill.files)).toContain('scripts/deploy.sh');
      expect(skill.files['scripts/deploy.sh']).toContain('Deploying to production');
    });
  });

  describe('simple skills remain as SimpleAgentSkill', () => {
    it('should classify skill with only SKILL.md as SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const simpleSkill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('simple')
      );
      expect(simpleSkill).toBeDefined();
      expect(simpleSkill?.type).toBe(CustomizationType.SimpleAgentSkill);
    });
  });

  describe('mixed simple and complex skills', () => {
    it('should correctly classify both simple and complex skills', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should have one AgentSkillIO (deploy) and one SimpleAgentSkill (simple)
      const agentSkillIO = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      const simpleSkills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);

      expect(agentSkillIO).toHaveLength(1);
      expect(simpleSkills).toHaveLength(1);
      expect(agentSkillIO[0]?.sourcePath).toContain('deploy');
      expect(simpleSkills[0]?.sourcePath).toContain('simple');
    });
  });
});
