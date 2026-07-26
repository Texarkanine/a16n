import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  type ManualPrompt,
  type SimpleAgentSkill,
} from '@a16njs/models';
import { discoverFixturesDir } from './test-support/discover-helpers.js';
import { suiteTempDir } from './test-support/emit-helpers.js';

const fixturesDir = discoverFixturesDir(import.meta.url);
const tempDir = suiteTempDir(import.meta.url, 'discover-skills');

/**
 * Write a single `.cursor/skills/probe/SKILL.md` with the given frontmatter and
 * run discovery over it. Used by the parser characterization suite, where each
 * case needs a different frontmatter body and a committed fixture per case
 * would be unwieldy.
 */
async function discoverProbeSkill(frontmatter: string) {
  const skillDir = path.join(tempDir, '.cursor', 'skills', 'probe');
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\n${frontmatter}\n---\n\nProbe body.\n`,
    'utf-8'
  );
  return cursorPlugin.discover(tempDir);
}

/** The description discovery produced for a probe skill, or undefined if it was skipped. */
async function probeDescription(frontmatter: string): Promise<string | undefined> {
  const result = await discoverProbeSkill(frontmatter);
  const skill = result.items.find(
    i => i.type === CustomizationType.SimpleAgentSkill
  ) as SimpleAgentSkill | undefined;
  return skill?.description;
}

describe('Cursor Skills Discovery', () => {
  describe('skills with description → SimpleAgentSkill', () => {
    it('should discover SimpleAgentSkill from .cursor/skills/*/SKILL.md with description', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skills).toHaveLength(1);
      expect(skills[0]?.sourcePath).toBe('.cursor/skills/deploy/SKILL.md');
    });

    it('should extract description from skill frontmatter', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.description).toBe('Helps with deploying services to production');
    });

    it('should use name from frontmatter in metadata', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill);
      expect(skill?.metadata?.name).toBe('deploy-service');
    });
  });

  describe('skills with disable-model-invocation → ManualPrompt', () => {
    it('should discover ManualPrompt from skill with disable-model-invocation: true', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const manualPrompts = result.items.filter(i => i.type === CustomizationType.ManualPrompt);
      expect(manualPrompts).toHaveLength(1);
      expect(manualPrompts[0]?.sourcePath).toBe('.cursor/skills/reset-db/SKILL.md');
    });

    it('should derive promptName from directory name, not frontmatter name', async () => {
      // Directory is 'reset-db'; frontmatter name is 'Database Reset' — they diverge
      // to prove promptName comes from the directory, not the frontmatter field.
      // Frontmatter name is preserved in metadata.name for display purposes.
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const prompt = result.items.find(i => i.type === CustomizationType.ManualPrompt) as ManualPrompt;
      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('reset-db');
      expect(prompt.metadata?.name).toBe('Database Reset');
    });
  });

  describe('skills without description or disable-model-invocation → skip', () => {
    it('should skip skill without description or disable-model-invocation and emit warning', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not be discovered as any type
      const invalidSkill = result.items.find(i => i.sourcePath.includes('invalid-skill'));
      expect(invalidSkill).toBeUndefined();

      // Should have warning
      const warning = result.warnings.find(w => w.message.includes('invalid-skill'));
      expect(warning).toBeDefined();
      expect(warning?.code).toBe(WarningCode.Skipped);
    });
  });

  describe('missing .cursor/skills/ directory', () => {
    it('should handle missing skills directory gracefully', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should not crash, just no skills
      const skills = result.items.filter(
        i =>
          i.type === CustomizationType.SimpleAgentSkill ||
          (i.type === CustomizationType.ManualPrompt && i.sourcePath.includes('skills')),
      );
      expect(skills).toHaveLength(0);
    });
  });

  describe('skill name field (invocation name)', () => {
    it('should set name from directory name on SimpleAgentSkill', async () => {
      const root = path.join(fixturesDir, 'cursor-skills/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skill = result.items.find(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill;
      expect(skill).toBeDefined();
      expect(skill.name).toBe('deploy');
    });
  });

  describe('recursive skill discovery (nested directories)', () => {
    it('should discover skills nested under category directories', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      expect(skills).toHaveLength(2);

      const names = skills.map(s => s.name).sort();
      expect(names).toEqual(['banana', 'tomato']);
    });

    it('should set correct sourcePath for nested skills', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      const tomato = skills.find(s => s.name === 'tomato');
      expect(tomato).toBeDefined();
      expect(tomato!.sourcePath).toBe('.cursor/skills/veggies/tomato/SKILL.md');
    });

    it('should set name from immediate parent directory, not category', async () => {
      const root = path.join(fixturesDir, 'cursor-skills-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      const skills = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill) as import('@a16njs/models').SimpleAgentSkill[];
      const tomato = skills.find(s => s.name === 'tomato');
      expect(tomato).toBeDefined();
      expect(tomato!.name).toBe('tomato');
    });
  });

  describe('skill frontmatter parser characterization', () => {
    /**
     * Pins how awkward `description:` values parse. Written against the
     * hand-rolled line-regex parser and re-run after the swap to gray-matter,
     * so every behavior change is a decision on the record rather than a
     * discovery made later.
     */
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should parse a plain description', async () => {
      expect(await probeDescription('description: Simple value')).toBe('Simple value');
    });

    it('should parse a double-quoted description', async () => {
      expect(await probeDescription('description: "Quoted value"')).toBe('Quoted value');
    });

    it('should parse a single-quoted description', async () => {
      expect(await probeDescription("description: 'Quoted value'")).toBe('Quoted value');
    });

    it('should strip trailing whitespace from a description', async () => {
      expect(await probeDescription('description: Trailing space   ')).toBe('Trailing space');
    });

    it('should preserve an apostrophe inside an unquoted description', async () => {
      expect(await probeDescription("description: It's fine")).toBe("It's fine");
    });

    it('should preserve a hash inside a quoted description', async () => {
      expect(await probeDescription('description: "Tagged #hash"')).toBe('Tagged #hash');
    });

    it('should preserve a colon inside a quoted description', async () => {
      expect(await probeDescription('description: "Deploy: the app"')).toBe('Deploy: the app');
    });
  });

  describe('AgentSkills.io spec fields', () => {
    const specRoot = () => path.join(fixturesDir, 'cursor-skills-spec-fields/from-cursor');

    it('should populate all four spec fields on a SimpleAgentSkill', async () => {
      const result = await cursorPlugin.discover(specRoot());

      const skill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('simple-spec')
      ) as SimpleAgentSkill;

      expect(skill).toBeDefined();
      expect(skill.license).toBe('Apache-2.0');
      expect(skill.compatibility).toBe('Requires Python 3.14+ and uv');
      expect(skill.specMetadata).toEqual({ author: 'Texarkanine', version: '1.2.0' });
      expect(skill.allowedTools).toBe('Bash(git:*) Bash(jq:*) Read');
    });

    it('should populate all four spec fields on a ManualPrompt', async () => {
      const result = await cursorPlugin.discover(specRoot());

      const prompt = result.items.find(
        i => i.type === CustomizationType.ManualPrompt
      ) as ManualPrompt;

      expect(prompt).toBeDefined();
      expect(prompt.promptName).toBe('manual-spec');
      expect(prompt.license).toBe('Proprietary. LICENSE.txt has complete terms');
      expect(prompt.compatibility).toBe('Requires a POSIX shell');
      expect(prompt.specMetadata).toEqual({ author: 'Texarkanine' });
      expect(prompt.allowedTools).toBe('Bash(rm:*)');
    });

    it('should leave the spec fields undefined when absent', async () => {
      const result = await cursorPlugin.discover(specRoot());

      const skill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('no-spec')
      ) as SimpleAgentSkill;

      expect(skill).toBeDefined();
      expect(skill.license).toBeUndefined();
      expect(skill.compatibility).toBeUndefined();
      expect(skill.specMetadata).toBeUndefined();
      expect(skill.allowedTools).toBeUndefined();
    });

    it('should not change classification (invariant 5)', async () => {
      const result = await cursorPlugin.discover(specRoot());

      const simple = result.items.filter(i => i.type === CustomizationType.SimpleAgentSkill);
      const io = result.items.filter(i => i.type === CustomizationType.AgentSkillIO);
      const manual = result.items.filter(i => i.type === CustomizationType.ManualPrompt);

      expect(simple).toHaveLength(2);
      expect(io).toHaveLength(1);
      expect(manual).toHaveLength(1);
    });

    it('should raise zero warnings at discover time', async () => {
      // discover() is target-unaware: spec fields are read, never judged here.
      const result = await cursorPlugin.discover(specRoot());

      expect(result.warnings).toEqual([]);
    });
  });

  /**
   * Cursor harness `paths:` on skills is Category A (#148): not in AgentSkills.io,
   * not modelled in the IR. Converting without it would widen skill scope, so
   * discovery must refuse the skill (Claude `hooks:` precedent) — Skipped, no item.
   */
  describe('skills with paths: → refuse (Skipped)', () => {
    beforeEach(async () => {
      await fs.mkdir(tempDir, { recursive: true });
    });

    afterEach(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    it('should refuse a SimpleAgentSkill that declares paths:', async () => {
      const result = await discoverProbeSkill(
        'description: Scoped helper\npaths:\n  - "src/**"'
      );

      expect(
        result.items.find(i => i.sourcePath.includes('probe'))
      ).toBeUndefined();

      const warning = result.warnings.find(w => w.sources?.some(s => s.includes('probe')));
      expect(warning).toBeDefined();
      expect(warning?.code).toBe(WarningCode.Skipped);
      expect(warning?.message.toLowerCase()).toContain('paths');
      expect(warning?.message.toLowerCase()).toMatch(/widen|scope|portable|cursor/);
    });

    it('should refuse before AgentSkillIO classification when paths: is present', async () => {
      const skillDir = path.join(tempDir, '.cursor', 'skills', 'probe');
      await fs.mkdir(skillDir, { recursive: true });
      await fs.writeFile(
        path.join(skillDir, 'SKILL.md'),
        '---\ndescription: Scoped with resources\npaths:\n  - "src/**"\n---\n\nBody.\n',
        'utf-8'
      );
      await fs.writeFile(path.join(skillDir, 'notes.md'), 'resource\n', 'utf-8');

      const result = await cursorPlugin.discover(tempDir);

      expect(result.items.filter(i => i.sourcePath.includes('probe'))).toHaveLength(0);
      const warning = result.warnings.find(w => w.message.toLowerCase().includes('paths'));
      expect(warning?.code).toBe(WarningCode.Skipped);
    });

    it('should refuse before ManualPrompt classification when paths: is present', async () => {
      const result = await discoverProbeSkill(
        'description: Manual scoped\ndisable-model-invocation: true\npaths:\n  - "lib/**"'
      );

      expect(
        result.items.find(i => i.sourcePath.includes('probe'))
      ).toBeUndefined();
      expect(
        result.warnings.find(w => w.message.toLowerCase().includes('paths'))?.code
      ).toBe(WarningCode.Skipped);
    });

    it('should refuse when paths: is present but empty', async () => {
      const result = await discoverProbeSkill('description: Empty paths\npaths: []');

      expect(
        result.items.find(i => i.sourcePath.includes('probe'))
      ).toBeUndefined();
      expect(
        result.warnings.find(w => w.message.toLowerCase().includes('paths'))?.code
      ).toBe(WarningCode.Skipped);
    });

    it('should refuse when paths: is a string rather than a list', async () => {
      const result = await discoverProbeSkill(
        'description: String paths\npaths: "src/**"'
      );

      expect(
        result.items.find(i => i.sourcePath.includes('probe'))
      ).toBeUndefined();
      expect(
        result.warnings.find(w => w.message.toLowerCase().includes('paths'))?.code
      ).toBe(WarningCode.Skipped);
    });

    it('should still discover a skill that has no paths: key', async () => {
      const result = await discoverProbeSkill('description: Unscoped helper');

      const skill = result.items.find(
        i => i.type === CustomizationType.SimpleAgentSkill && i.sourcePath.includes('probe')
      ) as SimpleAgentSkill | undefined;
      expect(skill).toBeDefined();
      expect(skill?.description).toBe('Unscoped helper');
      expect(result.warnings.filter(w => w.message.toLowerCase().includes('paths'))).toHaveLength(0);
    });
  });
});
