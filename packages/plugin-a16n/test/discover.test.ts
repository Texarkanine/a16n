import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  CustomizationType,
  CURRENT_IR_VERSION,
  WarningCode,
  type AgentCustomization,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
} from '@a16njs/models';
import { discover } from '../src/discover.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const tempDir = path.join(__dirname, '.temp-discover-test');

describe('A16n Plugin Discovery', () => {
  describe('basic discovery', () => {
    it('should return empty results when .a16n/ does not exist', async () => {
      // Use a directory that definitely has no .a16n/
      const result = await discover(path.join(fixturesDir, 'parse-globalPrompt'));

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return empty results when .a16n/ is empty', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-empty');
      const result = await discover(fixturePath);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should discover GlobalPrompt files', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      const globalPrompts = result.items.filter(
        (i) => i.type === CustomizationType.GlobalPrompt
      );
      expect(globalPrompts).toHaveLength(1);

      const gp = globalPrompts[0] as GlobalPrompt;
      expect(gp.type).toBe(CustomizationType.GlobalPrompt);
      expect(gp.version).toBe('v1beta1'); // from fixture file
      expect(gp.content).toContain('Always use TypeScript');
      expect(gp.content).toContain('functional programming');
      expect(gp.id).toContain('global-prompt:');
    });

    it('should discover FileRule files with globs', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      const fileRules = result.items.filter(
        (i) => i.type === CustomizationType.FileRule
      );
      expect(fileRules).toHaveLength(1);

      const fr = fileRules[0] as FileRule;
      expect(fr.type).toBe(CustomizationType.FileRule);
      expect(fr.version).toBe('v1beta1'); // from fixture file
      expect(fr.globs).toEqual(['*.ts', '*.tsx']);
      expect(fr.content).toContain('TypeScript specific rules');
    });

    it('should discover SimpleAgentSkill files with description', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      const skills = result.items.filter(
        (i) => i.type === CustomizationType.SimpleAgentSkill
      );
      expect(skills).toHaveLength(1);

      const skill = skills[0] as SimpleAgentSkill;
      expect(skill.type).toBe(CustomizationType.SimpleAgentSkill);
      expect(skill.name).toBe('database');
      expect(skill.description).toBe('Database operations and ORM usage');
      expect(skill.content).toContain('Use Prisma');
    });

    it('should discover AgentIgnore files with patterns', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      const ignores = result.items.filter(
        (i) => i.type === CustomizationType.AgentIgnore
      );
      expect(ignores).toHaveLength(1);

      const ignore = ignores[0] as AgentIgnore;
      expect(ignore.type).toBe(CustomizationType.AgentIgnore);
      expect(ignore.patterns).toEqual(['node_modules/', '*.log', '.env']);
      expect(ignore.content).toContain('Ignore patterns');
    });

    it('should discover ManualPrompt files', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      const manualPrompts = result.items.filter(
        (i) => i.type === CustomizationType.ManualPrompt
      );
      expect(manualPrompts).toHaveLength(1);

      const mp = manualPrompts[0] as ManualPrompt;
      expect(mp.type).toBe(CustomizationType.ManualPrompt);
      expect(mp.promptName).toBe('review');
      expect(mp.content).toContain('Review the code');
    });

    it('should discover all types in a single .a16n/ directory', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-basic');
      const result = await discover(fixturePath);

      // 5 types in discover-basic (no agent-skill-io)
      expect(result.items).toHaveLength(5);
      expect(result.warnings).toHaveLength(0);

      // Verify each type is represented
      const types = result.items.map((i) => i.type);
      expect(types).toContain(CustomizationType.GlobalPrompt);
      expect(types).toContain(CustomizationType.FileRule);
      expect(types).toContain(CustomizationType.SimpleAgentSkill);
      expect(types).toContain(CustomizationType.AgentIgnore);
      expect(types).toContain(CustomizationType.ManualPrompt);
    });
  });

  describe('relativeDir handling', () => {
    it('should extract relativeDir from subdirectories', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-nested');
      const result = await discover(fixturePath);

      const globalPrompts = result.items.filter(
        (i) => i.type === CustomizationType.GlobalPrompt
      );
      expect(globalPrompts).toHaveLength(1);

      const gp = globalPrompts[0] as GlobalPrompt;
      expect(gp.relativeDir).toBe('shared/company');
      expect(gp.content).toContain('Company coding standards');
    });

    it('should handle files directly in type directory (no relativeDir)', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-nested');
      const result = await discover(fixturePath);

      // The review.md is directly in manual-prompt/ (no relativeDir)
      const manualPrompts = result.items.filter(
        (i) => i.type === CustomizationType.ManualPrompt
      ) as ManualPrompt[];
      
      const topLevel = manualPrompts.find((m) => m.promptName === 'review');
      expect(topLevel).toBeDefined();
      expect(topLevel!.relativeDir).toBeUndefined();
    });

    it('should derive ManualPrompt promptName from relativeDir + basename', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-nested');
      const result = await discover(fixturePath);

      const manualPrompts = result.items.filter(
        (i) => i.type === CustomizationType.ManualPrompt
      ) as ManualPrompt[];

      // Should have 2 ManualPrompts: review.md (top-level) and shared/company/pr.md
      expect(manualPrompts).toHaveLength(2);

      // The nested one should have promptName derived from relativeDir + basename
      const nested = manualPrompts.find((m) => m.promptName === 'shared/company/pr');
      expect(nested).toBeDefined();
      expect(nested!.relativeDir).toBe('shared/company');
    });
  });

  describe('AgentSkillIO discovery', () => {
    it('should discover AgentSkillIO using readAgentSkillIO()', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-agentskill-io');
      const result = await discover(fixturePath);

      const skills = result.items.filter(
        (i) => i.type === CustomizationType.AgentSkillIO
      );
      expect(skills).toHaveLength(1);

      const skill = skills[0] as AgentSkillIO;
      expect(skill.type).toBe(CustomizationType.AgentSkillIO);
      expect(skill.name).toBe('deploy-helper');
      expect(skill.description).toBe('Deploy application to production');
      expect(skill.content).toContain('deployment steps');
      expect(skill.version).toBe(CURRENT_IR_VERSION); // AgentSkillIO has no version in file, we set current
    });

    it('should include resource files in AgentSkillIO items', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-agentskill-io');
      const result = await discover(fixturePath);

      const skill = result.items.find(
        (i) => i.type === CustomizationType.AgentSkillIO
      ) as AgentSkillIO;

      expect(skill.files).toBeDefined();
      expect(skill.files['checklist.md']).toBeDefined();
      expect(skill.files['checklist.md']).toContain('Run tests');
    });

    it('should handle AgentSkillIO without resource files', async () => {
      // Create a temp fixture with no resource files
      const tempFixture = path.join(tempDir, 'no-resources');
      const skillDir = path.join(tempFixture, '.a16n', 'agent-skill-io', 'simple-skill');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        `---
name: simple-skill
description: A simple skill with no resources
---

Just the SKILL.md content.
`,
        'utf-8'
      );

      const result = await discover(tempFixture);

      const skills = result.items.filter(
        (i) => i.type === CustomizationType.AgentSkillIO
      ) as AgentSkillIO[];
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('simple-skill');
      expect(skills[0].files).toEqual({});
    });

    it('should warn and skip AgentSkillIO with missing SKILL.md', async () => {
      // Create a temp fixture with a directory but no SKILL.md
      const tempFixture = path.join(tempDir, 'missing-skill');
      const skillDir = path.join(tempFixture, '.a16n', 'agent-skill-io', 'broken-skill');
      await fs.mkdir(skillDir, { recursive: true });
      // Just put a random file, no SKILL.md
      await fs.writeFile(
        path.join(skillDir, 'readme.txt'),
        'Not a SKILL.md',
        'utf-8'
      );

      const result = await discover(tempFixture);

      const skills = result.items.filter(
        (i) => i.type === CustomizationType.AgentSkillIO
      );
      expect(skills).toHaveLength(0);

      // Should have a warning about the failed read
      const skippedWarnings = result.warnings.filter(
        (w) => w.code === WarningCode.Skipped
      );
      expect(skippedWarnings.length).toBeGreaterThanOrEqual(1);
      expect(skippedWarnings[0].message).toContain('broken-skill');
    });
  });

  describe('version compatibility', () => {
    it('should accept compatible older version (v1beta1) without warning', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-version-mismatch');
      const result = await discover(fixturePath);

      // current.md has v1beta1; v1beta2 reader accepts it, no version warning
      const items = result.items.filter(
        (i) => i.content.includes('Current version content')
      );
      expect(items).toHaveLength(1);
      expect(items[0].version).toBe('v1beta1');
    });

    it('should warn on incompatible version (file newer than reader)', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-version-mismatch');
      const result = await discover(fixturePath);

      // future.md has v1beta99, should trigger VersionMismatch warning
      const versionWarnings = result.warnings.filter(
        (w) => w.code === WarningCode.VersionMismatch
      );
      expect(versionWarnings).toHaveLength(1);
      expect(versionWarnings[0].message).toContain('v1beta99');
      expect(versionWarnings[0].message).toContain(CURRENT_IR_VERSION);
    });

    it('should still include items with version mismatch', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-version-mismatch');
      const result = await discover(fixturePath);

      // Both current.md AND future.md should be in items
      expect(result.items).toHaveLength(2);

      const future = result.items.find((i) => i.version === 'v1beta99');
      expect(future).toBeDefined();
      expect(future!.content).toContain('Future version content');
    });

    it('should generate unique IDs for multiple files in the same type directory', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-version-mismatch');
      const result = await discover(fixturePath);

      // Both current.md and future.md are in .a16n/global-prompt/ — they must have distinct IDs
      expect(result.items).toHaveLength(2);
      const ids = result.items.map((i) => i.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should warn and skip unknown type directories', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-unknown-dir');
      const result = await discover(fixturePath);

      // Should discover the valid global-prompt
      const globalPrompts = result.items.filter(
        (i) => i.type === CustomizationType.GlobalPrompt
      );
      expect(globalPrompts).toHaveLength(1);

      // Should have a warning about unknown-type directory
      const skippedWarnings = result.warnings.filter(
        (w) => w.code === WarningCode.Skipped
      );
      expect(skippedWarnings).toHaveLength(1);
      expect(skippedWarnings[0].message).toContain('unknown-type');
    });

    it('should warn and skip files with invalid frontmatter', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-invalid-frontmatter');
      const result = await discover(fixturePath);

      // Should discover the valid file
      const validItems = result.items.filter(
        (i) => i.content.includes('A valid global prompt file')
      );
      expect(validItems).toHaveLength(1);

      // Should have warnings for invalid files (bad-yaml.md and missing-version.md)
      const skippedWarnings = result.warnings.filter(
        (w) => w.code === WarningCode.Skipped
      );
      expect(skippedWarnings.length).toBeGreaterThanOrEqual(2);
    });

    it('should warn and skip files with missing required fields', async () => {
      const fixturePath = path.join(fixturesDir, 'discover-invalid-frontmatter');
      const result = await discover(fixturePath);

      // missing-version.md should produce a Skipped warning
      const warnings = result.warnings.filter(
        (w) => w.code === WarningCode.Skipped && w.message.includes('missing-version')
      );
      expect(warnings).toHaveLength(1);
    });

    it('should skip non-.md files in type directories', async () => {
      // Create a temp fixture with a non-.md file
      const tempFixture = path.join(tempDir, 'non-md');
      const typeDir = path.join(tempFixture, '.a16n', 'global-prompt');
      await fs.mkdir(typeDir, { recursive: true });
      await fs.writeFile(
        path.join(typeDir, 'valid.md'),
        `---
version: v1beta1
type: global-prompt
---

Valid content.
`,
        'utf-8'
      );
      await fs.writeFile(
        path.join(typeDir, 'notes.txt'),
        'This should be skipped',
        'utf-8'
      );

      const result = await discover(tempFixture);

      // Only the .md file should be discovered
      expect(result.items).toHaveLength(1);
      expect(result.items[0].content).toContain('Valid content');
    });

    it('should skip non-directory entries in .a16n/', async () => {
      // Create a temp fixture with a file directly in .a16n/
      const tempFixture = path.join(tempDir, 'non-dir');
      const a16nDir = path.join(tempFixture, '.a16n');
      const typeDir = path.join(a16nDir, 'global-prompt');
      await fs.mkdir(typeDir, { recursive: true });
      await fs.writeFile(
        path.join(typeDir, 'valid.md'),
        `---
version: v1beta1
type: global-prompt
---

Valid content.
`,
        'utf-8'
      );
      // Put a file directly in .a16n/ (not a directory)
      await fs.writeFile(
        path.join(a16nDir, 'readme.txt'),
        'This is a file, not a type directory',
        'utf-8'
      );

      const result = await discover(tempFixture);

      // Only the valid .md in global-prompt/ should be discovered
      expect(result.items).toHaveLength(1);
      // No warnings for non-directory entries (they're just silently skipped)
    });
  });

  // Setup/teardown for temp directory tests
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });
});
