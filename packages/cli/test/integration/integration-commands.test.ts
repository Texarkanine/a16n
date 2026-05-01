/**
 * Integration tests: ManualPrompt (commands) and complex skills.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import {
  compareOutputs,
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  readDirFiles,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - ManualPrompt (Commands)', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'commands');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-command-to-claude', () => {
    it('should convert simple Cursor command to Claude skill', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-command-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify ManualPrompt was discovered
      const manualPrompts = result.discovered.filter(d => d.type === 'manual-prompt');
      expect(manualPrompts).toHaveLength(1);
      
      // Verify skill file was created
      const skillContent = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'review', 'SKILL.md'),
        'utf-8'
      );
      expect(skillContent).toContain('name: "review"');
      expect(skillContent).toContain('description: "Invoke with /review"');
      expect(skillContent).toContain('Security vulnerabilities');
    });
  });

  describe('cursor-command-complex-skipped', () => {
    it('should skip complex commands and emit warning', async () => {
      // Create a fixture with complex commands
      await fs.mkdir(path.join(tempDir, '.cursor', 'commands'), { recursive: true });
      
      // Complex command with $ARGUMENTS
      await fs.writeFile(
        path.join(tempDir, '.cursor', 'commands', 'fix-issue.md'),
        'Fix issue #$ARGUMENTS following best practices.',
        'utf-8'
      );
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // No commands should be discovered (complex is skipped)
      const manualPrompts = result.discovered.filter(d => d.type === 'manual-prompt');
      expect(manualPrompts).toHaveLength(0);
      
      // Should have a skipped warning
      const skippedWarning = result.warnings.find(
        w => w.code === 'skipped' && w.message.includes('fix-issue')
      );
      expect(skippedWarning).toBeDefined();
      expect(skippedWarning?.message).toContain('$ARGUMENTS');
    });
  });

  describe('cursor-to-cursor-command-passthrough', () => {
    it('should preserve commands in cursor-to-cursor conversion', async () => {
      // Create input commands
      await fs.mkdir(path.join(tempDir, '.cursor', 'commands'), { recursive: true });
      
      const commandContent = 'Review this code for security.';
      await fs.writeFile(
        path.join(tempDir, '.cursor', 'commands', 'review.md'),
        commandContent,
        'utf-8'
      );
      
      // Run cursor-to-cursor conversion (effectively a round-trip)
      const result = await engine.convert({
        source: 'cursor',
        target: 'cursor',
        root: tempDir,
      });
      
      // Command should be discovered and written back as ManualPrompt
      const manualPrompts = result.discovered.filter(d => d.type === 'manual-prompt');
      expect(manualPrompts).toHaveLength(1);
      
      // Verify file was written
      const outputContent = await fs.readFile(
        path.join(tempDir, '.cursor', 'commands', 'review.md'),
        'utf-8'
      );
      expect(outputContent).toBe(commandContent);
    });
  });

  describe('claude-to-cursor-no-commands', () => {
    it('should not produce ManualPrompts when converting from Claude (no skills with disable-model-invocation)', async () => {
      // Create Claude input with skills (but no commands - Claude has no command concept)
      await fs.mkdir(path.join(tempDir, '.claude', 'skills', 'testing'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.claude', 'skills', 'testing', 'SKILL.md'),
        `---
description: "Testing best practices"
---

Write unit tests first.
`,
        'utf-8'
      );
      
      // Run conversion
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // No ManualPrompts should be discovered (Claude has no command concept)
      const manualPrompts = result.discovered.filter(d => d.type === 'manual-prompt');
      expect(manualPrompts).toHaveLength(0);
      
      // .cursor/commands directory should NOT exist
      await expect(
        fs.access(path.join(tempDir, '.cursor', 'commands'))
      ).rejects.toThrow();
    });
  });

  describe('cursor-to-claude-complex-skill', () => {
    it('should convert complex Cursor skill with resources to Claude', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-complex-skill');
      const fromDir = path.join(fixturePath, 'from-cursor');
      const toDir = path.join(fixturePath, 'to-claude');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify conversion succeeded
      expect(result.discovered.length).toBe(1);
      expect(result.discovered[0].type).toBe('agent-skill-io');
      expect(result.written.length).toBeGreaterThan(0);
      
      // Read actual and expected outputs
      const actualSkillDir = path.join(tempDir, '.claude', 'skills', 'deploy');
      const expectedSkillDir = path.join(toDir, '.claude', 'skills', 'deploy');
      
      const actualFiles = await readDirFiles(actualSkillDir);
      const expectedFiles = await readDirFiles(expectedSkillDir);
      
      // Verify all files were created
      compareOutputs(actualFiles, expectedFiles);
      
      // Verify resource files exist
      expect(actualFiles.has('SKILL.md')).toBe(true);
      expect(actualFiles.has('checklist.md')).toBe(true);
      expect(actualFiles.has('config.json')).toBe(true);
    });
  });

  describe('roundtrip-cursor-complex', () => {
    it('should preserve complex Cursor skill through round-trip conversion', async () => {
      const fixturePath = path.join(fixturesDir, 'roundtrip-cursor-complex');
      const fromDir = path.join(fixturePath, 'from-cursor');
      const toDir = path.join(fixturePath, 'to-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Convert Cursor → Claude
      const result1 = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      expect(result1.discovered.length).toBe(1);
      expect(result1.discovered[0].type).toBe('agent-skill-io');
      
      // Convert Claude → Cursor (back)
      const result2 = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      expect(result2.discovered.length).toBe(1);
      expect(result2.discovered[0].type).toBe('agent-skill-io');
      
      // Read actual and expected outputs
      const actualSkillDir = path.join(tempDir, '.cursor', 'skills', 'database');
      const expectedSkillDir = path.join(toDir, '.cursor', 'skills', 'database');
      
      const actualFiles = await readDirFiles(actualSkillDir);
      const expectedFiles = await readDirFiles(expectedSkillDir);
      
      // Verify all files preserved through round-trip
      compareOutputs(actualFiles, expectedFiles);
      
      // Verify all resource files exist
      expect(actualFiles.has('SKILL.md')).toBe(true);
      expect(actualFiles.has('schema.sql')).toBe(true);
      expect(actualFiles.has('migrations.md')).toBe(true);
    });
  });

});
