import { describe, it, expect } from 'vitest';
import { buildMapping, rewriteContent, detectOrphans } from '../src/path-rewriter.js';
import type { AgentCustomization, AgentSkillIO, WrittenFile } from '@a16njs/models';
import { CustomizationType, WarningCode } from '@a16njs/models';

/**
 * Helper to create a minimal AgentCustomization for testing.
 */
function makeItem(overrides: Partial<AgentCustomization> & { content: string; sourcePath: string }): AgentCustomization {
  return {
    type: CustomizationType.GlobalPrompt,
    ...overrides,
  } as AgentCustomization;
}

/**
 * Helper to create a minimal WrittenFile for testing.
 */
function makeWritten(overrides: Partial<WrittenFile> & { path: string }): WrittenFile {
  return {
    type: CustomizationType.GlobalPrompt,
    itemCount: 1,
    isNewFile: true,
    ...overrides,
  };
}

/**
 * Helper to create a minimal AgentSkillIO for testing file-subtree rewriting.
 */
function makeSkillIO(overrides: Partial<AgentSkillIO> & {
  content: string;
  sourcePath: string;
  files: Record<string, string>;
}): AgentSkillIO {
  return {
    type: CustomizationType.AgentSkillIO,
    id: overrides.sourcePath,
    name: 'check',
    description: 'check skill',
    resources: [],
    ...overrides,
  } as AgentSkillIO;
}

describe('PathRewriter', () => {
  describe('buildMapping', () => {
    it('P1: correctly maps sourcePaths to relative target paths', () => {
      const discovered = [
        makeItem({ content: 'rule A', sourcePath: '.cursor/rules/coding.mdc' }),
      ];
      const written: WrittenFile[] = [
        makeWritten({
          path: '/project/target/.claude/rules/coding.md',
          sourceItems: [discovered[0]!],
        }),
      ];

      const { mapping } = buildMapping(discovered, written, '/project/source', '/project/target');

      expect(mapping.get('.cursor/rules/coding.mdc')).toBe('.claude/rules/coding.md');
    });

    it('P2: handles merged files (multiple sources → one target)', () => {
      const item1 = makeItem({ content: 'rule A', sourcePath: '.cursor/rules/a.mdc' });
      const item2 = makeItem({ content: 'rule B', sourcePath: '.cursor/rules/b.mdc' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/project/target/.claude/rules/merged.md',
          sourceItems: [item1, item2],
          itemCount: 2,
        }),
      ];

      const { mapping } = buildMapping([item1, item2], written, '/project/source', '/project/target');

      expect(mapping.get('.cursor/rules/a.mdc')).toBe('.claude/rules/merged.md');
      expect(mapping.get('.cursor/rules/b.mdc')).toBe('.claude/rules/merged.md');
    });

    it('P3: handles extension changes (.mdc → .md)', () => {
      const item = makeItem({ content: 'rule', sourcePath: '.cursor/rules/test.mdc' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/rules/test.md',
          sourceItems: [item],
        }),
      ];

      const { mapping } = buildMapping([item], written, '/in', '/out');

      expect(mapping.get('.cursor/rules/test.mdc')).toBe('.claude/rules/test.md');
    });

    it('P4: handles directory flattening', () => {
      const item = makeItem({
        content: 'rule',
        sourcePath: '.cursor/rules/shared/niko/deep/rule.mdc',
      });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/rules/rule.md',
          sourceItems: [item],
        }),
      ];

      const { mapping } = buildMapping([item], written, '/in', '/out');

      expect(mapping.get('.cursor/rules/shared/niko/deep/rule.mdc')).toBe('.claude/rules/rule.md');
    });

    // --- Behavior 2: WrittenFile.sourcePaths plumbing ---

    it('P14: uses explicit sourcePaths when provided', () => {
      const item = makeItem({ content: 'skill', sourcePath: '.cursor/skills/check/SKILL.md' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/skills/check/scripts/gotthis.sh',
          sourceItems: [item],
          sourcePaths: ['.cursor/skills/check/scripts/gotthis.sh'],
        }),
      ];

      const { mapping } = buildMapping([item], written, '/in', '/out');

      expect(mapping.get('.cursor/skills/check/scripts/gotthis.sh')).toBe(
        '.claude/skills/check/scripts/gotthis.sh'
      );
    });

    it('P15: sourcePaths takes precedence over sourceItems for that WrittenFile (prevents clobber)', () => {
      // The skill's SKILL.md and its resource both have sourceItems = [skill],
      // whose sourcePath is the skill's SKILL.md. Without sourcePaths on the
      // resource WrittenFile, the resource would clobber the SKILL.md mapping.
      const skill = makeItem({
        content: 'skill body',
        sourcePath: '.cursor/skills/check/SKILL.md',
      });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/skills/check/SKILL.md',
          sourceItems: [skill],
        }),
        makeWritten({
          path: '/out/.claude/skills/check/scripts/gotthis.sh',
          sourceItems: [skill],
          sourcePaths: ['.cursor/skills/check/scripts/gotthis.sh'],
        }),
      ];

      const { mapping } = buildMapping([skill], written, '/in', '/out');

      expect(mapping.get('.cursor/skills/check/SKILL.md')).toBe(
        '.claude/skills/check/SKILL.md'
      );
      expect(mapping.get('.cursor/skills/check/scripts/gotthis.sh')).toBe(
        '.claude/skills/check/scripts/gotthis.sh'
      );
    });

    it('P16: absent sourcePaths falls back to sourceItems (legacy behavior)', () => {
      const item = makeItem({ content: 'rule', sourcePath: '.cursor/rules/a.mdc' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/rules/a.md',
          sourceItems: [item],
        }),
      ];

      const { mapping } = buildMapping([item], written, '/in', '/out');
      expect(mapping.get('.cursor/rules/a.mdc')).toBe('.claude/rules/a.md');
    });

    // --- Behavior 2b: ambiguous-mapping collision detection ---

    it('P17: warns when same source key maps to different targets (sourceItems-derived)', () => {
      const itemA = makeItem({ content: 'x', sourcePath: '.cursor/rules/shared.mdc' });
      const itemB = makeItem({ content: 'y', sourcePath: '.cursor/rules/shared.mdc' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/rules/one.md',
          sourceItems: [itemA],
        }),
        makeWritten({
          path: '/out/.claude/rules/two.md',
          sourceItems: [itemB],
        }),
      ];

      const { mapping, warnings } = buildMapping([itemA, itemB], written, '/in', '/out');

      expect(warnings.length).toBeGreaterThan(0);
      const w = warnings[0]!;
      expect(w.code).toBe(WarningCode.Approximated);
      expect(w.message).toContain('.cursor/rules/shared.mdc');
      expect(w.message).toContain('.claude/rules/one.md');
      expect(w.message).toContain('.claude/rules/two.md');
      expect(w.message.toLowerCase()).toContain('sourcepaths');
      // Last-writer-wins preserved
      expect(mapping.get('.cursor/rules/shared.mdc')).toBe('.claude/rules/two.md');
    });

    it('P18: no warning for same source key mapping to same target (idempotent)', () => {
      const itemA = makeItem({ content: 'x', sourcePath: '.cursor/rules/shared.mdc' });
      const itemB = makeItem({ content: 'y', sourcePath: '.cursor/rules/shared.mdc' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/rules/shared.md',
          sourceItems: [itemA],
        }),
        makeWritten({
          path: '/out/.claude/rules/shared.md',
          sourceItems: [itemB],
        }),
      ];

      const { warnings } = buildMapping([itemA, itemB], written, '/in', '/out');
      expect(warnings).toHaveLength(0);
    });

    it('P19: warns for same-key collisions produced from sourcePaths', () => {
      const item = makeItem({ content: 'x', sourcePath: '.cursor/skills/check/SKILL.md' });
      const written: WrittenFile[] = [
        makeWritten({
          path: '/out/.claude/skills/check/scripts/a.sh',
          sourceItems: [item],
          sourcePaths: ['.cursor/skills/check/scripts/shared.sh'],
        }),
        makeWritten({
          path: '/out/.claude/skills/check/scripts/b.sh',
          sourceItems: [item],
          sourcePaths: ['.cursor/skills/check/scripts/shared.sh'],
        }),
      ];

      const { warnings } = buildMapping([item], written, '/in', '/out');
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]!.code).toBe(WarningCode.Approximated);
      expect(warnings[0]!.message).toContain('.cursor/skills/check/scripts/shared.sh');
    });
  });

  describe('rewriteContent', () => {
    it('P5: replaces exact source path with target path', () => {
      const mapping = new Map([
        ['.cursor/rules/auth.mdc', '.claude/rules/auth.md'],
      ]);
      const items = [
        makeItem({
          content: 'Load: .cursor/rules/auth.mdc for auth',
          sourcePath: '.cursor/rules/other.mdc',
        }),
      ];

      const result = rewriteContent(items, mapping);

      expect(result.items[0]!.content).toBe('Load: .claude/rules/auth.md for auth');
      expect(result.replacementCount).toBe(1);
    });

    it('P6: handles multiple replacements in one content string', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
        ['.cursor/rules/b.mdc', '.claude/rules/b.md'],
      ]);
      const items = [
        makeItem({
          content: 'See .cursor/rules/a.mdc and .cursor/rules/b.mdc for details',
          sourcePath: '.cursor/rules/c.mdc',
        }),
      ];

      const result = rewriteContent(items, mapping);

      expect(result.items[0]!.content).toBe('See .claude/rules/a.md and .claude/rules/b.md for details');
      expect(result.replacementCount).toBe(2);
    });

    it('P7: replaces longest match first (no partial match corruption)', () => {
      const mapping = new Map([
        ['.cursor/rules/auth.mdc', '.claude/rules/auth.md'],
        ['.cursor/rules/auth.mdc.bak', '.claude/rules/auth-backup.md'],
      ]);
      const items = [
        makeItem({
          content: 'See .cursor/rules/auth.mdc.bak and .cursor/rules/auth.mdc',
          sourcePath: '.cursor/rules/other.mdc',
        }),
      ];

      const result = rewriteContent(items, mapping);

      expect(result.items[0]!.content).toBe(
        'See .claude/rules/auth-backup.md and .claude/rules/auth.md'
      );
      expect(result.replacementCount).toBe(2);
    });

    it('P8: leaves non-matching paths untouched', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
      ]);
      const items = [
        makeItem({
          content: 'Reference .cursor/rules/unrelated.mdc here',
          sourcePath: '.cursor/rules/b.mdc',
        }),
      ];

      const result = rewriteContent(items, mapping);

      expect(result.items[0]!.content).toBe('Reference .cursor/rules/unrelated.mdc here');
      expect(result.replacementCount).toBe(0);
    });

    it('P9: handles self-references (file referencing itself)', () => {
      const mapping = new Map([
        ['.cursor/rules/self.mdc', '.claude/rules/self.md'],
      ]);
      const items = [
        makeItem({
          content: 'This file is at .cursor/rules/self.mdc',
          sourcePath: '.cursor/rules/self.mdc',
        }),
      ];

      const result = rewriteContent(items, mapping);

      expect(result.items[0]!.content).toBe('This file is at .claude/rules/self.md');
      expect(result.replacementCount).toBe(1);
    });

    it('P13: rewritten items are clones (originals not mutated)', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
      ]);
      const original = makeItem({
        content: 'See .cursor/rules/a.mdc',
        sourcePath: '.cursor/rules/b.mdc',
      });
      const originalContent = original.content;

      const result = rewriteContent([original], mapping);

      expect(original.content).toBe(originalContent);
      expect(result.items[0]!.content).toBe('See .claude/rules/a.md');
      expect(result.items[0]).not.toBe(original);
    });

    // --- Behavior 7: rewrite inside AgentSkillIO files[*] for spec text subtrees ---

    it('P20: rewrites scripts/** and references/** files; leaves assets/** and unknown untouched', () => {
      const mapping = new Map([
        ['.cursor/skills/check/scripts/b.sh', '.claude/skills/check/scripts/b.sh'],
        ['.cursor/rules/foo.mdc', '.claude/rules/foo.md'],
      ]);
      const original = makeSkillIO({
        content: 'SKILL body references .cursor/skills/check/scripts/b.sh',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'scripts/a.sh': 'prefix .cursor/skills/check/scripts/b.sh suffix',
          'references/a.md': 'link to .cursor/rules/foo.mdc here',
          'assets/tmpl.txt': '.cursor/skills/check/scripts/b.sh in asset',
          'data/raw.csv': '.cursor/skills/check/scripts/b.sh in unknown',
        },
      });
      const originalFilesSnapshot = { ...original.files };

      const result = rewriteContent([original], mapping);
      const clone = result.items[0]! as AgentSkillIO;

      expect(clone.content).toBe('SKILL body references .claude/skills/check/scripts/b.sh');

      expect(clone.files['scripts/a.sh']).toBe(
        'prefix .claude/skills/check/scripts/b.sh suffix'
      );
      expect(clone.files['references/a.md']).toBe('link to .claude/rules/foo.md here');
      expect(clone.files['assets/tmpl.txt']).toBe('.cursor/skills/check/scripts/b.sh in asset');
      expect(clone.files['data/raw.csv']).toBe('.cursor/skills/check/scripts/b.sh in unknown');

      // Originals untouched
      expect(original.files['scripts/a.sh']).toBe(originalFilesSnapshot['scripts/a.sh']);
      expect(original.files['references/a.md']).toBe(originalFilesSnapshot['references/a.md']);

      // body (1) + scripts/a.sh (1) + references/a.md (1) = 3
      expect(result.replacementCount).toBe(3);
    });

    it('P21: AgentSkillIO with empty files map: content rewrite still works', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
      ]);
      const item = makeSkillIO({
        content: 'See .cursor/rules/a.mdc',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {},
      });

      const result = rewriteContent([item], mapping);
      expect(result.items[0]!.content).toBe('See .claude/rules/a.md');
      expect(result.replacementCount).toBe(1);
    });

    it('P22: mixed AgentSkillIO + non-AgentSkillIO: files only touched on AgentSkillIO', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
      ]);
      const plain = makeItem({
        content: 'See .cursor/rules/a.mdc',
        sourcePath: '.cursor/rules/b.mdc',
      });
      const skillIO = makeSkillIO({
        content: 'Skill refs .cursor/rules/a.mdc',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'scripts/helper.sh': '.cursor/rules/a.mdc',
        },
      });

      const result = rewriteContent([plain, skillIO], mapping);
      expect(result.items[0]!.content).toBe('See .claude/rules/a.md');
      expect(result.items[1]!.content).toBe('Skill refs .claude/rules/a.md');
      expect((result.items[1]! as AgentSkillIO).files['scripts/helper.sh']).toBe(
        '.claude/rules/a.md'
      );
      // plain (1) + skillIO.content (1) + skillIO.files['scripts/helper.sh'] (1) = 3
      expect(result.replacementCount).toBe(3);
    });

    it('P23: nested-path scope check — scripts/lib/* in scope; skill-root + bare "scripts" out of scope', () => {
      const mapping = new Map([
        ['.cursor/rules/x.mdc', '.claude/rules/x.md'],
      ]);
      const item = makeSkillIO({
        content: '',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'scripts/lib/helper.sh': '.cursor/rules/x.mdc', // in scope (prefix scripts/)
          'notes.txt': '.cursor/rules/x.mdc', // skill root — out of scope
          'scripts': '.cursor/rules/x.mdc', // degenerate: exactly "scripts" — out of scope
        },
      });

      const result = rewriteContent([item], mapping);
      const clone = result.items[0]! as AgentSkillIO;
      expect(clone.files['scripts/lib/helper.sh']).toBe('.claude/rules/x.md');
      expect(clone.files['notes.txt']).toBe('.cursor/rules/x.mdc');
      expect(clone.files['scripts']).toBe('.cursor/rules/x.mdc');
      expect(result.replacementCount).toBe(1);
    });
  });

  describe('detectOrphans', () => {
    it('P10: finds source-format paths not in mapping', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
      ]);
      const items = [
        makeItem({
          content: 'See .cursor/rules/a.mdc and also .cursor/rules/orphan.mdc',
          sourcePath: '.cursor/rules/b.mdc',
        }),
      ];

      const warnings = detectOrphans(items, mapping, ['.cursor/rules/', '.cursor/skills/'], ['.mdc', '.md']);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.code).toBe(WarningCode.OrphanPathRef);
      expect(warnings[0]!.message).toContain('.cursor/rules/orphan.mdc');
    });

    it('P11: does not false-positive on mapped paths', () => {
      const mapping = new Map([
        ['.cursor/rules/a.mdc', '.claude/rules/a.md'],
        ['.cursor/rules/b.mdc', '.claude/rules/b.md'],
      ]);
      const items = [
        makeItem({
          content: 'See .cursor/rules/a.mdc and .cursor/rules/b.mdc',
          sourcePath: '.cursor/rules/c.mdc',
        }),
      ];

      const warnings = detectOrphans(items, mapping, ['.cursor/rules/', '.cursor/skills/'], ['.mdc', '.md']);

      expect(warnings).toHaveLength(0);
    });

    it('P12: returns warning with file path and orphan string', () => {
      const mapping = new Map<string, string>();
      const items = [
        makeItem({
          content: 'Reference to .cursor/rules/missing.mdc here',
          sourcePath: '.cursor/rules/item.mdc',
        }),
      ];

      const warnings = detectOrphans(items, mapping, ['.cursor/rules/'], ['.mdc']);

      expect(warnings).toHaveLength(1);
      expect(warnings[0]!.code).toBe(WarningCode.OrphanPathRef);
      expect(warnings[0]!.message).toContain('.cursor/rules/missing.mdc');
      expect(warnings[0]!.sources).toContain('.cursor/rules/item.mdc');
    });

    // --- Behavior 8: detectOrphans scans scripts/** and references/** content ---

    it('P24: flags orphans inside AgentSkillIO files[scripts/**] and files[references/**]', () => {
      const mapping = new Map<string, string>();
      const item = makeSkillIO({
        content: '',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'scripts/a.sh': 'missing: .cursor/rules/gone-a.mdc',
          'references/b.md': 'missing: .cursor/rules/gone-b.mdc',
        },
      });

      const warnings = detectOrphans([item], mapping, ['.cursor/rules/'], ['.mdc']);

      const msgs = warnings.map((w) => w.message);
      expect(msgs.some((m) => m.includes('.cursor/rules/gone-a.mdc'))).toBe(true);
      expect(msgs.some((m) => m.includes('.cursor/rules/gone-b.mdc'))).toBe(true);
      for (const w of warnings) {
        expect(w.sources).toContain('.cursor/skills/check/SKILL.md');
      }
    });

    it('P25: does NOT flag orphans inside assets/** or unknown subtrees', () => {
      const mapping = new Map<string, string>();
      const item = makeSkillIO({
        content: '',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'assets/tmpl.txt': 'placeholder: .cursor/rules/placeholder.mdc',
          'data/raw.csv': 'col,.cursor/rules/maybe.mdc,col',
        },
      });

      const warnings = detectOrphans([item], mapping, ['.cursor/rules/'], ['.mdc']);
      expect(warnings).toHaveLength(0);
    });

    it('P26: existing content-level orphan detection preserved alongside files scan', () => {
      const mapping = new Map<string, string>();
      const item = makeSkillIO({
        content: 'body refs .cursor/rules/body-missing.mdc',
        sourcePath: '.cursor/skills/check/SKILL.md',
        files: {
          'scripts/a.sh': 'script refs .cursor/rules/script-missing.mdc',
        },
      });

      const warnings = detectOrphans([item], mapping, ['.cursor/rules/'], ['.mdc']);
      const msgs = warnings.map((w) => w.message);
      expect(msgs.some((m) => m.includes('body-missing.mdc'))).toBe(true);
      expect(msgs.some((m) => m.includes('script-missing.mdc'))).toBe(true);
    });
  });
});
