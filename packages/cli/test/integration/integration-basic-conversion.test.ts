/**
 * Fixture-based integration tests for a16n.
 *
 * Test fixtures follow the pattern:
 *   fixtures/<test-name>/from-<agent>/... (input files)
 *   fixtures/<test-name>/to-<agent>/... (expected output files)
 *
 * The test copies from-* to a temp directory, runs conversion,
 * then compares the result with to-*.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import {
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  readDirFiles,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - Fixture Based', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'basic-conversion');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-to-claude-basic', () => {
    it('should convert a single Cursor rule to Claude format', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-basic');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify conversion succeeded
      expect(result.discovered.length).toBeGreaterThan(0);
      expect(result.written.length).toBeGreaterThan(0);
      
      // Read actual and expected outputs
      const actualRulesDir = path.join(tempDir, '.claude', 'rules');
      const actualFiles = await readDirFiles(actualRulesDir);
      
      // Verify rule file was created
      expect(actualFiles.size).toBeGreaterThan(0);
      
      // Check content includes expected text from cursor rule
      const ruleContent = Array.from(actualFiles.values())[0];
      expect(ruleContent).toContain('Always use TypeScript');
    });
  });

  describe('claude-to-cursor-basic', () => {
    it('should convert CLAUDE.md to a Cursor rule', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-to-cursor-basic');
      const fromDir = path.join(fixturePath, 'from-claude');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // Verify conversion succeeded
      expect(result.discovered.length).toBeGreaterThan(0);
      expect(result.written.length).toBeGreaterThan(0);
      
      // Read actual outputs
      const rulesDir = path.join(tempDir, '.cursor', 'rules');
      const actualFiles = await readDirFiles(rulesDir);
      
      // Verify a rule file was created
      expect(actualFiles.size).toBeGreaterThan(0);
      
      // Check the content includes the original text
      const ruleContent = Array.from(actualFiles.values())[0];
      expect(ruleContent).toContain('alwaysApply: true');
      expect(ruleContent).toContain('Write tests for all functions');
      expect(ruleContent).toContain('Follow DRY principles');
    });
  });

  describe('cursor-to-claude-multiple', () => {
    it('should emit multiple Cursor rules as separate .claude/rules/*.md files', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-multiple');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify multiple items discovered
      expect(result.discovered.length).toBe(2);
      // BREAKING: Each gets its own file now
      expect(result.written.length).toBe(2);
      
      // BREAKING: Should NOT have a Merged warning
      expect(result.warnings.some(w => w.code === 'merged')).toBe(false);
      
      // Read actual rule files
      const rulesDir = path.join(tempDir, '.claude', 'rules');
      const files = await fs.readdir(rulesDir);
      expect(files).toHaveLength(2);
      
      // Read both files and verify both rules are present
      const contents = await Promise.all(
        files.map(f => fs.readFile(path.join(rulesDir, f), 'utf-8'))
      );
      const combinedContent = contents.join('\n');
      
      // Should contain both rules (in separate files)
      expect(combinedContent).toContain('Use 2-space indentation');
      expect(combinedContent).toContain('Write unit tests');
    });
  });

  describe('dry-run mode', () => {
    it('should not write files in dry-run mode', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-basic');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion in dry-run mode
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
        dryRun: true,
      });
      
      // Should discover items and show what would be written (without actually writing)
      expect(result.discovered.length).toBeGreaterThan(0);
      expect(result.written.length).toBeGreaterThan(0); // Now returns what WOULD be written
      
      // But .claude/rules/ should NOT actually exist (files not written in dry-run)
      await expect(
        fs.access(path.join(tempDir, '.claude', 'rules'))
      ).rejects.toThrow();
    });
  });

  describe('empty project', () => {
    it('should handle project with no rules', async () => {
      // Empty temp dir (no rules)
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      expect(result.discovered.length).toBe(0);
      expect(result.written.length).toBe(0);
      expect(result.warnings.length).toBe(0);
    });
  });
});
