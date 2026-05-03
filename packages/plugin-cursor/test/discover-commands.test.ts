import { describe, it, expect } from 'vitest';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import { CustomizationType, WarningCode, type ManualPrompt } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'fix-issue',
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'pr-review',
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'deploy',
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'analyze',
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
        i => i.type === CustomizationType.ManualPrompt && (i as ManualPrompt).promptName === 'secure',
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
