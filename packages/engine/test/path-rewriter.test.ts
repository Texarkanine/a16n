import { describe, it, expect } from 'vitest';
import { buildMapping, rewriteContent, detectOrphans } from '../src/path-rewriter.js';
import type { AgentCustomization, WrittenFile } from '@a16njs/models';
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

      const mapping = buildMapping(discovered, written, '/project/source', '/project/target');

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

      const mapping = buildMapping([item1, item2], written, '/project/source', '/project/target');

      // Both source paths map to the same target
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

      const mapping = buildMapping([item], written, '/in', '/out');

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

      const mapping = buildMapping([item], written, '/in', '/out');

      expect(mapping.get('.cursor/rules/shared/niko/deep/rule.mdc')).toBe('.claude/rules/rule.md');
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

      // Original should be untouched
      expect(original.content).toBe(originalContent);
      // Clone should have new content
      expect(result.items[0]!.content).toBe('See .claude/rules/a.md');
      // Should not be the same object reference
      expect(result.items[0]).not.toBe(original);
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
  });
});
