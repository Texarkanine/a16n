/**
 * Integration tests: a16n IR plugin round-trips.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { CURRENT_IR_VERSION, WarningCode } from '@a16njs/models';
import {
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  readDirFiles,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - a16n IR Plugin', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'a16n-plugin');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('a16n discovery', () => {
    it('should discover items from .a16n/ directory', async () => {
      const fixturePath = path.join(fixturesDir, 'a16n-basic');
      const fromDir = path.join(fixturePath, 'from-a16n');

      // Copy input to temp
      await copyDir(fromDir, tempDir);

      // Run conversion (discover from a16n, emit to cursor)
      const result = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });

      // Verify items were discovered
      expect(result.discovered.length).toBeGreaterThan(0);
    });

    it('should discover all 6 IR types from .a16n/', async () => {
      const fixturePath = path.join(fixturesDir, 'a16n-basic');
      const fromDir = path.join(fixturePath, 'from-a16n');

      // Copy input to temp
      await copyDir(fromDir, tempDir);

      // Run conversion
      const result = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });

      // Verify all 6 types are discovered
      const types = new Set(result.discovered.map(d => d.type));
      expect(types.has('global-prompt')).toBe(true);
      expect(types.has('file-rule')).toBe(true);
      expect(types.has('simple-agent-skill')).toBe(true);
      expect(types.has('agent-ignore')).toBe(true);
      expect(types.has('manual-prompt')).toBe(true);
      expect(types.has('agent-skill-io')).toBe(true);
      expect(result.discovered).toHaveLength(6);
    });
  });

  describe('a16n-to-cursor conversion', () => {
    it('should convert a16n IR to Cursor format', async () => {
      const fixturePath = path.join(fixturesDir, 'a16n-basic');
      const fromDir = path.join(fixturePath, 'from-a16n');

      // Copy input to temp
      await copyDir(fromDir, tempDir);

      // Run conversion
      const result = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(6);
      expect(result.written.length).toBeGreaterThan(0);

      // Verify Cursor rules were created
      const rulesDir = path.join(tempDir, '.cursor', 'rules');
      const ruleFiles = await readDirFiles(rulesDir);
      expect(ruleFiles.size).toBeGreaterThan(0);

      // Check GlobalPrompt was emitted as alwaysApply Cursor rule
      const ruleContents = Array.from(ruleFiles.values());
      const hasGlobalPrompt = ruleContents.some(c => c.includes('Always use TypeScript'));
      expect(hasGlobalPrompt).toBe(true);
    });
  });

  describe('a16n-to-claude conversion', () => {
    it('should convert a16n IR to Claude format', async () => {
      const fixturePath = path.join(fixturesDir, 'a16n-basic');
      const fromDir = path.join(fixturePath, 'from-a16n');

      // Copy input to temp
      await copyDir(fromDir, tempDir);

      // Run conversion
      const result = await engine.convert({
        source: 'a16n',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(6);
      expect(result.written.length).toBeGreaterThan(0);

      // Verify Claude rules were created
      const rulesDir = path.join(tempDir, '.claude', 'rules');
      const ruleFiles = await readDirFiles(rulesDir);
      expect(ruleFiles.size).toBeGreaterThan(0);

      // Check GlobalPrompt was emitted as Claude rule
      const ruleContents = Array.from(ruleFiles.values());
      const hasGlobalPrompt = ruleContents.some(c => c.includes('Always use TypeScript'));
      expect(hasGlobalPrompt).toBe(true);
    });
  });

  describe('round-trip: cursor → a16n → cursor', () => {
    it('should preserve content through cursor → a16n → cursor round-trip', async () => {
      // Create a cursor project with a simple rule
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorRulesDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorRulesDir, 'coding.mdc'),
        `---
alwaysApply: true
---

Always use TypeScript strict mode.
Follow DRY principles.
`,
        'utf-8'
      );

      // Step 1: Convert Cursor → a16n
      const toA16n = await engine.convert({
        source: 'cursor',
        target: 'a16n',
        root: tempDir,
      });
      expect(toA16n.discovered.length).toBeGreaterThan(0);
      expect(toA16n.written.length).toBeGreaterThan(0);

      // Verify .a16n/ was created
      const a16nDir = path.join(tempDir, '.a16n');
      const a16nStat = await fs.stat(a16nDir);
      expect(a16nStat.isDirectory()).toBe(true);

      // Step 2: Remove original Cursor rules to prove round-trip works
      await fs.rm(path.join(tempDir, '.cursor'), { recursive: true, force: true });

      // Step 3: Convert a16n → Cursor
      const toCursor = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });
      expect(toCursor.discovered.length).toBeGreaterThan(0);
      expect(toCursor.written.length).toBeGreaterThan(0);

      // Verify Cursor rules were recreated with the original content preserved
      const restoredRulesDir = path.join(tempDir, '.cursor', 'rules');
      const restoredFiles = await readDirFiles(restoredRulesDir);
      expect(restoredFiles.size).toBeGreaterThan(0);

      const restoredContent = Array.from(restoredFiles.values()).join('\n');
      expect(restoredContent).toContain('Always use TypeScript strict mode');
      expect(restoredContent).toContain('Follow DRY principles');
    });
  });

  describe('round-trip: claude → a16n → claude', () => {
    it('should preserve content through claude → a16n → claude round-trip', async () => {
      // Create a Claude project with a rule
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      await fs.mkdir(claudeRulesDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeRulesDir, 'standards.md'),
        `---
trigger: always
---

Write tests for all functions.
Use meaningful variable names.
`,
        'utf-8'
      );

      // Step 1: Convert Claude → a16n
      const toA16n = await engine.convert({
        source: 'claude',
        target: 'a16n',
        root: tempDir,
      });
      expect(toA16n.discovered.length).toBeGreaterThan(0);
      expect(toA16n.written.length).toBeGreaterThan(0);

      // Verify .a16n/ was created
      const a16nDir = path.join(tempDir, '.a16n');
      const a16nStat = await fs.stat(a16nDir);
      expect(a16nStat.isDirectory()).toBe(true);

      // Step 2: Remove original Claude rules
      await fs.rm(path.join(tempDir, '.claude'), { recursive: true, force: true });

      // Step 3: Convert a16n → Claude
      const toClaude = await engine.convert({
        source: 'a16n',
        target: 'claude',
        root: tempDir,
      });
      expect(toClaude.discovered.length).toBeGreaterThan(0);
      expect(toClaude.written.length).toBeGreaterThan(0);

      // Verify Claude rules were recreated with original content preserved
      const restoredRulesDir = path.join(tempDir, '.claude', 'rules');
      const restoredFiles = await readDirFiles(restoredRulesDir);
      expect(restoredFiles.size).toBeGreaterThan(0);

      const restoredContent = Array.from(restoredFiles.values()).join('\n');
      expect(restoredContent).toContain('Write tests for all functions');
      expect(restoredContent).toContain('Use meaningful variable names');
    });
  });

  describe('cross-format: cursor → a16n → claude', () => {
    it('should preserve content through cursor → a16n → claude round-trip', async () => {
      // Create a Cursor project with a rule
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      await fs.mkdir(cursorRulesDir, { recursive: true });
      await fs.writeFile(
        path.join(cursorRulesDir, 'style.mdc'),
        `---
alwaysApply: true
---

Use consistent naming conventions.
Prefer const over let.
`,
        'utf-8'
      );

      // Step 1: Convert Cursor → a16n (IR)
      const toA16n = await engine.convert({
        source: 'cursor',
        target: 'a16n',
        root: tempDir,
      });
      expect(toA16n.discovered.length).toBeGreaterThan(0);
      expect(toA16n.written.length).toBeGreaterThan(0);

      // Step 2: Remove Cursor source to prove the IR carries the content
      await fs.rm(path.join(tempDir, '.cursor'), { recursive: true, force: true });

      // Step 3: Convert a16n → Claude
      const toClaude = await engine.convert({
        source: 'a16n',
        target: 'claude',
        root: tempDir,
      });
      expect(toClaude.discovered.length).toBeGreaterThan(0);
      expect(toClaude.written.length).toBeGreaterThan(0);

      // Verify Claude rules contain the original Cursor content
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      const claudeFiles = await readDirFiles(claudeRulesDir);
      expect(claudeFiles.size).toBeGreaterThan(0);

      const claudeContent = Array.from(claudeFiles.values()).join('\n');
      expect(claudeContent).toContain('Use consistent naming conventions');
      expect(claudeContent).toContain('Prefer const over let');
    });
  });

  describe('cross-format: claude → a16n → cursor', () => {
    it('should preserve content through claude → a16n → cursor round-trip', async () => {
      // Create a Claude project with a rule
      const claudeRulesDir = path.join(tempDir, '.claude', 'rules');
      await fs.mkdir(claudeRulesDir, { recursive: true });
      await fs.writeFile(
        path.join(claudeRulesDir, 'quality.md'),
        `---
trigger: always
---

Always write documentation for public APIs.
Use descriptive error messages.
`,
        'utf-8'
      );

      // Step 1: Convert Claude → a16n (IR)
      const toA16n = await engine.convert({
        source: 'claude',
        target: 'a16n',
        root: tempDir,
      });
      expect(toA16n.discovered.length).toBeGreaterThan(0);
      expect(toA16n.written.length).toBeGreaterThan(0);

      // Step 2: Remove Claude source to prove the IR carries the content
      await fs.rm(path.join(tempDir, '.claude'), { recursive: true, force: true });

      // Step 3: Convert a16n → Cursor
      const toCursor = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });
      expect(toCursor.discovered.length).toBeGreaterThan(0);
      expect(toCursor.written.length).toBeGreaterThan(0);

      // Verify Cursor rules contain the original Claude content
      const cursorRulesDir = path.join(tempDir, '.cursor', 'rules');
      const cursorFiles = await readDirFiles(cursorRulesDir);
      expect(cursorFiles.size).toBeGreaterThan(0);

      const cursorContent = Array.from(cursorFiles.values()).join('\n');
      expect(cursorContent).toContain('Always write documentation for public APIs');
      expect(cursorContent).toContain('Use descriptive error messages');
    });
  });

  describe('version mismatch warning', () => {
    it('should emit VersionMismatch warning for incompatible IR versions', async () => {
      // Create a .a16n/ directory with a file that has an incompatible version
      // v1beta99 is valid but incompatible with current v1beta1 (revision too high)
      const a16nDir = path.join(tempDir, '.a16n', 'global-prompt');
      await fs.mkdir(a16nDir, { recursive: true });
      await fs.writeFile(
        path.join(a16nDir, 'future-rule.md'),
        `---
version: v1beta99
type: global-prompt
---

This rule is from a future revision.
`,
        'utf-8'
      );

      // Run discovery (a16n → cursor)
      const result = await engine.convert({
        source: 'a16n',
        target: 'cursor',
        root: tempDir,
      });

      // Should still discover the item (processed despite mismatch)
      expect(result.discovered.length).toBeGreaterThan(0);

      // Should have emitted a VersionMismatch warning
      const versionWarnings = result.warnings.filter(
        w => w.code === WarningCode.VersionMismatch
      );
      expect(versionWarnings).toHaveLength(1);
      expect(versionWarnings[0].message).toContain('v1beta99');
      expect(versionWarnings[0].message).toContain(CURRENT_IR_VERSION);
    });
  });
});
