/**
 * Integration tests: split roots (--from-dir / --to-dir).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import {
  createIntegrationEngine,
  fixturesDirFor,
  suiteTempDir,
} from '../test-support/integration-helpers.js';

const fixturesDir = fixturesDirFor(import.meta.url);

describe('Integration Tests - Split Directories (--from-dir / --to-dir)', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'split-dirs');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('convert with sourceRoot reads from specified source, writes to default root', async () => {
    const sourceDir = path.join(tempDir, 'source');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/coding.mdc'),
      '---\nalwaysApply: true\n---\n\nAlways use TypeScript.'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: tempDir,
      sourceRoot: sourceDir,
    });

    expect(result.discovered).toHaveLength(1);
    expect(result.written).toHaveLength(1);
    // Output should be in tempDir (the default root), not sourceDir
    expect(result.written[0]!.path).toContain(tempDir);
    expect(result.written[0]!.path).not.toContain(path.join(tempDir, 'source'));
    // Verify file was created
    const rulesDir = path.join(tempDir, '.claude', 'rules');
    const files = await fs.readdir(rulesDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it('convert with targetRoot reads from default root, writes to specified target', async () => {
    const targetDir = path.join(tempDir, 'target');
    await fs.mkdir(targetDir, { recursive: true });
    await fs.mkdir(path.join(tempDir, '.cursor', 'rules'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, '.cursor/rules/coding.mdc'),
      '---\nalwaysApply: true\n---\n\nAlways use TypeScript.'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: tempDir,
      targetRoot: targetDir,
    });

    expect(result.discovered).toHaveLength(1);
    expect(result.written).toHaveLength(1);
    // Output should be in targetDir
    expect(result.written[0]!.path).toContain(targetDir);
    // Verify file content
    const rulesDir = path.join(targetDir, '.claude', 'rules');
    const files = await fs.readdir(rulesDir);
    expect(files.length).toBeGreaterThan(0);
    const content = await fs.readFile(path.join(rulesDir, files[0]!), 'utf-8');
    expect(content).toContain('Always use TypeScript');
  });

  it('convert with both sourceRoot and targetRoot', async () => {
    const sourceDir = path.join(tempDir, 'src');
    const targetDir = path.join(tempDir, 'out');
    await fs.mkdir(path.join(sourceDir, '.cursor', 'rules'), { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(
      path.join(sourceDir, '.cursor/rules/style.mdc'),
      '---\nalwaysApply: true\n---\n\nUse 2-space indentation.'
    );

    const result = await engine.convert({
      source: 'cursor',
      target: 'claude',
      root: '/unused',
      sourceRoot: sourceDir,
      targetRoot: targetDir,
    });

    expect(result.discovered).toHaveLength(1);
    expect(result.written).toHaveLength(1);
    expect(result.written[0]!.path).toContain(targetDir);
    // tempDir root should NOT have output
    await expect(fs.access(path.join(tempDir, '.claude'))).rejects.toThrow();
    // Verify content
    const rulesDir = path.join(targetDir, '.claude', 'rules');
    const content = await fs.readFile(path.join(rulesDir, 'style.md'), 'utf-8');
    expect(content).toContain('Use 2-space indentation');
  });
});
