/**
 * Fixture-based integration tests for the agentsmd plugin.
 *
 * Covers the AGENTS.md escape hatch (agentsmd → cursor/claude produces
 * path-scoped rules), the lossy entrance (cursor → agentsmd warns about
 * everything it cannot represent), and IR durability (agentsmd → a16n →
 * agentsmd round-trips byte-identically).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { CustomizationType } from '@a16njs/models';
import {
  copyDir,
  createIntegrationEngine,
  fixturesDirFor,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - AGENTS.md plugin', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'agentsmd');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('agentsmd-to-cursor (escape hatch)', () => {
    it('should convert root AGENTS.md to an alwaysApply rule and nested AGENTS.md to a globs rule', async () => {
      const fromDir = path.join(fixturesDir, 'agentsmd-to-cursor', 'from-agentsmd');
      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'agentsmd',
        target: 'cursor',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(2);
      expect(result.written).toHaveLength(2);
      expect(result.unsupported).toHaveLength(0);

      const rootRule = await fs.readFile(
        path.join(tempDir, '.cursor', 'rules', 'AGENTS.mdc'),
        'utf-8'
      );
      expect(rootRule).toContain('alwaysApply: true');
      expect(rootRule).toContain('Always use TypeScript strict mode.');

      const webRule = await fs.readFile(
        path.join(tempDir, '.cursor', 'rules', 'web', 'AGENTS.mdc'),
        'utf-8'
      );
      expect(webRule).toContain('globs: web/**');
      expect(webRule).toContain('Use React function components only.');
    });
  });

  describe('agentsmd-to-claude (escape hatch)', () => {
    it('should convert nested AGENTS.md to a Claude rule with paths frontmatter', async () => {
      const fromDir = path.join(fixturesDir, 'agentsmd-to-claude', 'from-agentsmd');
      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'agentsmd',
        target: 'claude',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(2);
      expect(result.written).toHaveLength(2);

      const rootRule = await fs.readFile(
        path.join(tempDir, '.claude', 'rules', 'AGENTS.md'),
        'utf-8'
      );
      expect(rootRule).not.toMatch(/^---/);
      expect(rootRule).toContain('Always use TypeScript strict mode.');

      const webRule = await fs.readFile(
        path.join(tempDir, '.claude', 'rules', 'web', 'AGENTS.md'),
        'utf-8'
      );
      expect(webRule).toMatch(/^---\npaths:\n {2}- web\/\*\*\n---/);
      expect(webRule).toContain('Use React function components only.');
    });
  });

  describe('cursor-to-agentsmd (lossy entrance)', () => {
    it('should emit representable rules and warn about everything else', async () => {
      const fromDir = path.join(fixturesDir, 'cursor-to-agentsmd', 'from-cursor');
      await copyDir(fromDir, tempDir);

      const result = await engine.convert({
        source: 'cursor',
        target: 'agentsmd',
        root: tempDir,
      });

      expect(result.discovered).toHaveLength(4);

      // alwaysApply rule → root AGENTS.md
      const rootContent = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
      expect(rootContent).toContain('Always use TypeScript strict mode.');

      // src/** rule → src/AGENTS.md
      const srcContent = await fs.readFile(
        path.join(tempDir, 'src', 'AGENTS.md'),
        'utf-8'
      );
      expect(srcContent).toContain('Keep modules under 200 lines.');

      // *.ts rule cannot be represented → Skipped warning
      const skipped = result.warnings.filter(w => w.code === 'skipped');
      expect(skipped).toHaveLength(1);
      expect(skipped[0]!.sources).toEqual(['.cursor/rules/ts-files.mdc']);

      // skill → unsupported
      expect(result.unsupported).toHaveLength(1);
      expect(result.unsupported[0]!.type).toBe(CustomizationType.SimpleAgentSkill);
    });
  });

  describe('agentsmd round-trip via IR', () => {
    it('should survive agentsmd → a16n → agentsmd byte-identically', async () => {
      const fromDir = path.join(fixturesDir, 'agentsmd-roundtrip', 'from-agentsmd');
      await copyDir(fromDir, tempDir);

      const originalRoot = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
      const originalApi = await fs.readFile(
        path.join(tempDir, 'packages', 'api', 'AGENTS.md'),
        'utf-8'
      );

      // Into IR
      const toIr = await engine.convert({
        source: 'agentsmd',
        target: 'a16n',
        root: tempDir,
      });
      expect(toIr.written.length).toBeGreaterThan(0);

      // Remove the originals, then convert back out of IR
      await fs.rm(path.join(tempDir, 'AGENTS.md'));
      await fs.rm(path.join(tempDir, 'packages', 'api', 'AGENTS.md'));

      const fromIr = await engine.convert({
        source: 'a16n',
        target: 'agentsmd',
        root: tempDir,
      });
      expect(fromIr.written).toHaveLength(2);

      const roundTrippedRoot = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
      const roundTrippedApi = await fs.readFile(
        path.join(tempDir, 'packages', 'api', 'AGENTS.md'),
        'utf-8'
      );

      expect(roundTrippedRoot).toBe(originalRoot);
      expect(roundTrippedApi).toBe(originalApi);
    });
  });
});
