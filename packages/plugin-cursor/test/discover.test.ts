import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import { CustomizationType, WarningCode, type AgentCommand } from '@a16njs/models';

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

describe('AgentSkill Discovery (Phase 2)', () => {
  it('should discover AgentSkill items from rules with description: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);
    
    // All should be AgentSkill
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.AgentSkill);
    }
  });

  it('should extract description from frontmatter without quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill).toBeDefined();
    expect(authSkill?.type).toBe(CustomizationType.AgentSkill);
    expect((authSkill as import('@a16njs/models').AgentSkill).description).toBe('Authentication and authorization patterns');
  });

  it('should extract description from frontmatter with quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const dbSkill = result.items.find(i => i.sourcePath.includes('database'));
    expect(dbSkill).toBeDefined();
    expect(dbSkill?.type).toBe(CustomizationType.AgentSkill);
    expect((dbSkill as import('@a16njs/models').AgentSkill).description).toBe('Database operations and ORM usage');
  });

  it('should include rule content in AgentSkill items', async () => {
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

  it('should classify rules with description (no globs) as AgentSkill', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.AgentSkill);
    }
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

describe('AgentCommand Discovery (Phase 4)', () => {
  describe('simple commands', () => {
    it('should discover simple commands from .cursor/commands/', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.AgentCommand);
      expect(commands).toHaveLength(2);
    });

    it('should extract commandName from filename', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'review'
      );
      expect(reviewCommand).toBeDefined();
      expect(reviewCommand?.sourcePath).toBe('.cursor/commands/review.md');
    });

    it('should include command content', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'review'
      ) as AgentCommand;
      expect(reviewCommand.content).toContain('Security vulnerabilities');
      expect(reviewCommand.content).toContain('Performance issues');
    });

    it('should discover commands alongside rules', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const globalPrompt = result.items.find(i => i.type === CustomizationType.GlobalPrompt);
      const commands = result.items.filter(i => i.type === CustomizationType.AgentCommand);

      expect(globalPrompt).toBeDefined();
      expect(commands).toHaveLength(2);
    });
  });

  describe('complex commands (skipped)', () => {
    it('should skip commands with $ARGUMENTS', async () => {
      const root = path.join(fixturesDir, 'cursor-command-complex/from-cursor');
      const result = await cursorPlugin.discover(root);

      const fixIssueCommand = result.items.find(
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'fix-issue'
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
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'pr-review'
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
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'deploy'
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
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'analyze'
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
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'secure'
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

      const commands = result.items.filter(i => i.type === CustomizationType.AgentCommand);
      expect(commands).toHaveLength(1);
      expect((commands[0] as AgentCommand).commandName).toBe('simple');

      const warning = result.warnings.find(w => w.message.includes('complex'));
      expect(warning).toBeDefined();
    });
  });

  describe('nested commands', () => {
    it('should discover commands in subdirectories', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.AgentCommand);
      expect(commands).toHaveLength(2);

      const commandNames = commands.map(c => (c as AgentCommand).commandName);
      expect(commandNames).toContain('component');
      expect(commandNames).toContain('api');
    });

    it('should include nested path in sourcePath', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const componentCommand = result.items.find(
        i => i.type === CustomizationType.AgentCommand && (i as AgentCommand).commandName === 'component'
      );
      expect(componentCommand?.sourcePath).toBe('.cursor/commands/frontend/component.md');
    });
  });

  describe('no commands', () => {
    it('should return no commands for project without .cursor/commands/', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      const commands = result.items.filter(i => i.type === CustomizationType.AgentCommand);
      expect(commands).toHaveLength(0);
    });
  });
});
