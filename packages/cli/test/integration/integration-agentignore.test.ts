/**
 * Integration tests: AgentIgnore / cursorignore behavior.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import {
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - AgentIgnore', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'agentignore');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-ignore-to-claude', () => {
    it('should convert .cursorignore to permissions.deny in settings.json', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-ignore-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify AgentIgnore was discovered
      const agentIgnores = result.discovered.filter(d => d.type === 'agent-ignore');
      expect(agentIgnores).toHaveLength(1);
      
      // Verify settings.json was created with permissions.deny
      const settings = JSON.parse(
        await fs.readFile(
          path.join(tempDir, '.claude', 'settings.json'),
          'utf-8'
        )
      );
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.deny).toBeInstanceOf(Array);
      expect(settings.permissions.deny).toContain('Read(./dist/**)');
      expect(settings.permissions.deny).toContain('Read(./.env)');
      expect(settings.permissions.deny).toContain('Read(./**/*.log)');
      
      // Verify approximation warning was emitted
      const approxWarning = result.warnings.find(w => w.code === 'approximated');
      expect(approxWarning).toBeDefined();
      expect(approxWarning?.message).toContain('permissions.deny');
    });
  });

  describe('claude-ignore-to-cursor', () => {
    it('should convert permissions.deny Read rules to .cursorignore', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-ignore-to-cursor');
      const fromDir = path.join(fixturePath, 'from-claude');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // Verify AgentIgnore was discovered
      const agentIgnores = result.discovered.filter(d => d.type === 'agent-ignore');
      expect(agentIgnores).toHaveLength(1);
      
      // Verify .cursorignore was created
      const ignoreContent = await fs.readFile(
        path.join(tempDir, '.cursorignore'),
        'utf-8'
      );
      expect(ignoreContent).toContain('dist/');
      expect(ignoreContent).toContain('.env');
      expect(ignoreContent).toContain('*.log');
    });
  });

  describe('round-trip: cursor -> claude -> cursor', () => {
    it('should preserve patterns through round-trip conversion', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-ignore-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Save original .cursorignore
      const originalIgnore = await fs.readFile(
        path.join(tempDir, '.cursorignore'),
        'utf-8'
      );
      const originalPatterns = originalIgnore
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      
      // Convert Cursor -> Claude
      await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Delete original .cursorignore to avoid confusion
      await fs.unlink(path.join(tempDir, '.cursorignore'));
      
      // Convert Claude -> Cursor
      await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // Read new .cursorignore
      const newIgnore = await fs.readFile(
        path.join(tempDir, '.cursorignore'),
        'utf-8'
      );
      const newPatterns = newIgnore
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.startsWith('#'));
      
      // Verify all original patterns are preserved
      for (const pattern of originalPatterns) {
        expect(newPatterns).toContain(pattern);
      }
    });
  });
});
