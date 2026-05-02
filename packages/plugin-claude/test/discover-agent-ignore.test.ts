import { describe, it, expect } from 'vitest';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import { CustomizationType, type AgentIgnore } from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);

describe('Claude AgentIgnore Discovery', () => {
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
