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
import a16nPlugin from '@a16njs/plugin-a16n';
import { WarningCode } from '@a16njs/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const tempDir = path.join(__dirname, '.temp-integration');

// Create engine with all three plugins
const engine = new A16nEngine([cursorPlugin, claudePlugin, a16nPlugin]);

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

describe('Integration Tests - Phase 2 FileRule and SimpleAgentSkill', () => {
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
      
      // Verify rule file was created in .claude/rules/
      const ruleContent = await fs.readFile(
        path.join(tempDir, '.claude', 'rules', 'react.md'),
        'utf-8'
      );
      expect(ruleContent).toContain('Use React best practices');
      expect(ruleContent).toContain('paths:');
      expect(ruleContent).toContain('**/*.tsx');
      
      // BREAKING: settings.local.json should NOT exist (native rules now)
      await expect(
        fs.access(path.join(tempDir, '.claude', 'settings.local.json'))
      ).rejects.toThrow();
      
      // BREAKING: NO approximation warning (native support now)
      const approxWarning = result.warnings.find(w => w.code === 'approximated');
      expect(approxWarning).toBeUndefined();
    });
  });

  describe('cursor-agentskill-to-claude', () => {
    it('should convert Cursor SimpleAgentSkill to Claude skill', async () => {
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
      
      // Verify SimpleAgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
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
      
      // Verify SimpleAgentSkill was discovered
      const agentSkills = result.discovered.filter(d => d.type === 'simple-agent-skill');
      expect(agentSkills).toHaveLength(1);
      
      // Read the output skill files (Phase 7: SimpleAgentSkill → .cursor/skills/)
      const skillsDir = path.join(tempDir, '.cursor', 'skills');
      const dirs = await fs.readdir(skillsDir);
      expect(dirs).toHaveLength(1);
      
      const skillContent = await fs.readFile(
        path.join(skillsDir, dirs[0]!, 'SKILL.md'),
        'utf-8'
      );
      expect(skillContent).toContain('description:');
      expect(skillContent).toContain('Testing best practices');
      expect(skillContent).toContain('Write unit tests first');
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

describe('Integration Tests - Phase 4 ManualPrompt (Commands)', () => {
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

describe('Integration Tests - Phase 9 a16n IR Plugin', () => {
  beforeEach(async () => {
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
      expect(versionWarnings[0].message).toContain('v1beta1');
    });
  });
});
