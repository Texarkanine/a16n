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
import { A16nEngine } from '@a16njs/engine';
import cursorPlugin from '@a16njs/plugin-cursor';
import claudePlugin from '@a16njs/plugin-claude';

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

describe('Integration Tests - Phase 2 FileRule and AgentSkill', () => {
  beforeEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('cursor-filerule-to-claude', () => {
    it('should convert Cursor FileRule to Claude hooks', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-filerule-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify FileRule was discovered
      const fileRules = result.discovered.filter(d => d.type === 'file-rule');
      expect(fileRules).toHaveLength(1);
      
      // Verify rule content file was created
      const ruleContent = await fs.readFile(
        path.join(tempDir, '.a16n', 'rules', 'react.txt'),
        'utf-8'
      );
      expect(ruleContent).toContain('Use React best practices');
      
      // Verify settings.local.json was created with hooks
      const settings = JSON.parse(
        await fs.readFile(
          path.join(tempDir, '.claude', 'settings.local.json'),
          'utf-8'
        )
      );
      expect(settings.hooks).toBeDefined();
      expect(settings.hooks.PreToolUse).toHaveLength(1);
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toContain('@a16njs/glob-hook');
      expect(settings.hooks.PreToolUse[0].hooks[0].command).toContain('**/*.tsx');
      
      // Verify approximation warning was emitted
      const approxWarning = result.warnings.find(w => w.code === 'approximated');
      expect(approxWarning).toBeDefined();
    });
  });

  describe('cursor-agentskill-to-claude', () => {
    it('should convert Cursor AgentSkill to Claude skill', async () => {
      const fixturePath = path.join(fixturesDir, 'cursor-agentskill-to-claude');
      const fromDir = path.join(fixturePath, 'from-cursor');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'cursor',
        target: 'claude',
        root: tempDir,
      });
      
      // Verify AgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'agent-skill');
      expect(agentSkills).toHaveLength(1);
      
      // Verify skill file was created
      const skillContent = await fs.readFile(
        path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md'),
        'utf-8'
      );
      // Description is quoted for YAML safety
      expect(skillContent).toContain('description: "Authentication and authorization helper"');
      expect(skillContent).toContain('Use JWT for stateless authentication');
    });
  });

  describe('claude-skill-to-cursor', () => {
    it('should convert Claude skill to Cursor rule with description', async () => {
      const fixturePath = path.join(fixturesDir, 'claude-skill-to-cursor');
      const fromDir = path.join(fixturePath, 'from-claude');
      
      // Copy input to temp
      await copyDir(fromDir, tempDir);
      
      // Run conversion
      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: tempDir,
      });
      
      // Verify AgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'agent-skill');
      expect(agentSkills).toHaveLength(1);
      
      // Read the output rule files
      const rulesDir = path.join(tempDir, '.cursor', 'rules');
      const files = await fs.readdir(rulesDir);
      expect(files).toHaveLength(1);
      
      const ruleContent = await fs.readFile(
        path.join(rulesDir, files[0]!),
        'utf-8'
      );
      expect(ruleContent).toContain('description:');
      expect(ruleContent).toContain('Testing best practices');
      expect(ruleContent).toContain('Write unit tests first');
    });
  });
});

describe('Integration Tests - Phase 3 AgentIgnore', () => {
  beforeEach(async () => {
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

describe('Integration Tests - Phase 4 AgentCommand', () => {
  beforeEach(async () => {
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
      
      // Verify AgentCommand was discovered
      const agentCommands = result.discovered.filter(d => d.type === 'agent-command');
      expect(agentCommands).toHaveLength(1);
      
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
      const agentCommands = result.discovered.filter(d => d.type === 'agent-command');
      expect(agentCommands).toHaveLength(0);
      
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
      
      // Command should be discovered and written back
      const agentCommands = result.discovered.filter(d => d.type === 'agent-command');
      expect(agentCommands).toHaveLength(1);
      
      // Verify file was written
      const outputContent = await fs.readFile(
        path.join(tempDir, '.cursor', 'commands', 'review.md'),
        'utf-8'
      );
      expect(outputContent).toBe(commandContent);
    });
  });

  describe('claude-to-cursor-no-commands', () => {
    it('should not produce AgentCommands when converting from Claude', async () => {
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
      
      // No AgentCommands should be discovered (Claude has no command concept)
      const agentCommands = result.discovered.filter(d => d.type === 'agent-command');
      expect(agentCommands).toHaveLength(0);
      
      // .cursor/commands directory should NOT exist
      await expect(
        fs.access(path.join(tempDir, '.cursor', 'commands'))
      ).rejects.toThrow();
    });
  });
});
