import { describe, it, expect } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType, WarningCode, type ManualPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

/** Discover a fixture and index its ManualPrompts by promptName. */
async function discoverCommands(fixture: string) {
  const root = path.join(fixturesDir, fixture, 'from-cursor');
  const result = await cursorPlugin.discover(root);
  const commands = result.items.filter(
    i => i.type === CustomizationType.ManualPrompt,
  ) as ManualPrompt[];
  return {
    root,
    warnings: result.warnings,
    commands,
    byName: (name: string) => commands.find(c => c.promptName === name),
  };
}

/** Assert a discovered command's content is byte-identical to its source file. */
async function expectByteIdentical(root: string, command: ManualPrompt | undefined) {
  expect(command).toBeDefined();
  const source = await fs.readFile(path.join(root, command!.sourcePath), 'utf-8');
  expect(command!.content).toBe(source);
}

describe('ManualPrompt Discovery (commands)', () => {
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'review',
      );
      expect(reviewCommand).toBeDefined();
      expect(reviewCommand?.sourcePath).toBe('.cursor/commands/review.md');
    });

    it('should include command content', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'review',
      ) as ManualPrompt;
      expect(reviewCommand.content).toContain('Security vulnerabilities');
      expect(reviewCommand.content).toContain('Performance issues');
    });

    it('should leave description undefined for command-origin ManualPrompts', async () => {
      const root = path.join(fixturesDir, 'cursor-command-simple/from-cursor');
      const result = await cursorPlugin.discover(root);

      const reviewCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'review',
      ) as ManualPrompt;
      expect(reviewCommand.description).toBeUndefined();
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

  describe('commands with runtime features (discovered)', () => {
    it.each([
      ['fix-issue', '$ARGUMENTS'],
      ['pr-review', 'positional parameters'],
      ['deploy', 'bash execution'],
      ['analyze', 'file references (@)'],
      ['secure', 'allowed-tools frontmatter'],
    ])('should discover %s (%s) instead of skipping it', async promptName => {
      const { root, byName } = await discoverCommands('cursor-command-runtime-features');

      await expectByteIdentical(root, byName(promptName));
    });

    it('should emit no Skipped warnings for any command', async () => {
      const { warnings } = await discoverCommands('cursor-command-runtime-features');

      expect(warnings.filter(w => w.code === WarningCode.Skipped)).toHaveLength(0);
    });
  });

  describe('@mention false positives (#142)', () => {
    it('should discover commands with prose @mentions, with no warnings', async () => {
      const { root, byName, warnings } = await discoverCommands('cursor-command-mentions');

      await expectByteIdentical(root, byName('pr-feedback-judge'));
      expect(warnings).toHaveLength(0);
    });

    it('should discover commands with @mentions inside shell strings, with no warnings', async () => {
      const { root, byName, warnings } = await discoverCommands('cursor-command-mentions');

      await expectByteIdentical(root, byName('coderabbit-pr'));
      expect(warnings).toHaveLength(0);
    });
  });

  describe('command frontmatter advisory (OQ4)', () => {
    it('should emit exactly one Approximated warning per frontmatter-bearing command', async () => {
      const { warnings } = await discoverCommands('cursor-command-runtime-features');

      const sources = warnings
        .filter(w => w.code === WarningCode.Approximated)
        .flatMap(w => w.sources ?? []);
      expect(sources.sort()).toEqual([
        '.cursor/commands/deploy.md',
        '.cursor/commands/pr.md',
        '.cursor/commands/secure.md',
      ]);
    });

    it('should name the command and say the block is preserved as body content', async () => {
      const { warnings } = await discoverCommands('cursor-command-runtime-features');

      const warning = warnings.find(w => w.sources?.includes('.cursor/commands/secure.md'));
      expect(warning?.code).toBe(WarningCode.Approximated);
      expect(warning?.message).toContain("'secure'");
      expect(warning?.message).toContain('frontmatter');
      expect(warning?.message).toContain('body content');
    });

    it('should warn for a Claude-migrated command and keep its frontmatter in content', async () => {
      const { root, byName, warnings } = await discoverCommands('cursor-command-runtime-features');

      const pr = byName('pr');
      await expectByteIdentical(root, pr);
      expect(pr?.content).toContain('model: claude-sonnet-4');
      expect(
        warnings.filter(w => w.sources?.includes('.cursor/commands/pr.md')),
      ).toHaveLength(1);
    });

    it('should emit no warning for commands without frontmatter', async () => {
      const { warnings } = await discoverCommands('cursor-command-runtime-features');

      const unwarned = ['analyze.md', 'fix-issue.md', 'pr-review.md'];
      for (const file of unwarned) {
        expect(warnings.filter(w => w.sources?.includes(`.cursor/commands/${file}`))).toHaveLength(0);
      }
    });
  });

  describe('mixed commands', () => {
    it('should discover both simple and frontmatter-bearing commands', async () => {
      const { root, commands, byName, warnings } = await discoverCommands('cursor-command-mixed');

      expect(commands.map(c => c.promptName).sort()).toEqual(['complex', 'simple']);
      await expectByteIdentical(root, byName('simple'));
      await expectByteIdentical(root, byName('complex'));

      expect(warnings.filter(w => w.sources?.includes('.cursor/commands/simple.md'))).toHaveLength(0);
      const complexWarnings = warnings.filter(w =>
        w.sources?.includes('.cursor/commands/complex.md'),
      );
      expect(complexWarnings).toHaveLength(1);
      expect(complexWarnings[0]?.code).toBe(WarningCode.Approximated);
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'component',
      );
      expect(componentCommand?.sourcePath).toBe('.cursor/commands/frontend/component.md');
    });

    it('should set relativeDir from directory nesting to avoid name collisions', async () => {
      const root = path.join(fixturesDir, 'cursor-command-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const componentCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'component',
      ) as ManualPrompt;
      const apiCommand = result.items.find(
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'api',
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
