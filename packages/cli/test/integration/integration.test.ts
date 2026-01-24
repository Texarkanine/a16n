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
import { fileURLToPath } from 'url';
import { A16nEngine } from '@a16n/engine';
import cursorPlugin from '@a16n/plugin-cursor';
import claudePlugin from '@a16n/plugin-claude';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const tempDir = path.join(__dirname, '.temp-integration');

// Create engine
const engine = new A16nEngine([cursorPlugin, claudePlugin]);

/**
 * Recursively copy a directory.
 */
async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Recursively read all files in a directory into a map.
 */
async function readDirFiles(dir: string, base: string = ''): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const relativePath = base ? `${base}/${entry.name}` : entry.name;
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await readDirFiles(fullPath, relativePath);
        for (const [k, v] of subFiles) {
          files.set(k, v);
        }
      } else {
        const content = await fs.readFile(fullPath, 'utf-8');
        files.set(relativePath, content);
      }
    }
  } catch {
    // Directory doesn't exist
  }
  
  return files;
}

/**
 * Compare actual output with expected output.
 */
function compareOutputs(actual: Map<string, string>, expected: Map<string, string>): void {
  // Check all expected files exist with correct content
  for (const [path, expectedContent] of expected) {
    const actualContent = actual.get(path);
    expect(actualContent, `Expected file ${path} to exist`).toBeDefined();
    expect(actualContent?.trim(), `Content mismatch in ${path}`).toBe(expectedContent.trim());
  }
}

describe('Integration Tests - Fixture Based', () => {
  beforeEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-to-claude-basic', () => {
    it('should convert a single Cursor rule to CLAUDE.md', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-basic');
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
      expect(result.discovered.length).toBeGreaterThan(0);
      expect(result.written.length).toBeGreaterThan(0);
      
      // Read actual and expected outputs
      const actualFiles = await readDirFiles(tempDir);
      const expectedFiles = await readDirFiles(toDir);
      
      // Compare CLAUDE.md content
      const actualClaude = actualFiles.get('CLAUDE.md');
      const expectedClaude = expectedFiles.get('CLAUDE.md');
      
      expect(actualClaude).toBeDefined();
      expect(actualClaude?.trim()).toBe(expectedClaude?.trim());
    });
  });

  describe('claude-to-cursor-basic', () => {
    it('should convert CLAUDE.md to a Cursor rule', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-to-cursor-basic');
      const fromDir = path.join(fixturePath, 'from-claude');
      const toDir = path.join(fixturePath, 'to-cursor');
      
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
    it('should merge multiple Cursor rules into single CLAUDE.md', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-to-claude-multiple');
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
      
      // Verify multiple items discovered
      expect(result.discovered.length).toBe(2);
      expect(result.written.length).toBe(1); // Merged into single file
      
      // Should have a Merged warning
      expect(result.warnings.some(w => w.code === 'merged')).toBe(true);
      
      // Read actual CLAUDE.md
      const actualContent = await fs.readFile(
        path.join(tempDir, 'CLAUDE.md'),
        'utf-8'
      );
      
      // Should contain both rules
      expect(actualContent).toContain('Use 2-space indentation');
      expect(actualContent).toContain('Write unit tests');
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
      
      // Should discover items but not write
      expect(result.discovered.length).toBeGreaterThan(0);
      expect(result.written.length).toBe(0);
      
      // CLAUDE.md should NOT exist
      await expect(
        fs.access(path.join(tempDir, 'CLAUDE.md'))
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
