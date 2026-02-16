import { describe, it, expect } from 'vitest';
import { CustomizationType, WarningCode } from '@a16njs/models';
import type { A16nPlugin, AgentCustomization, EmitResult, WrittenFile } from '@a16njs/models';
import {
  PathRewritingTransformation,
  type TransformationContext,
} from '../src/transformation.js';

/**
 * Helper to create a minimal fake plugin for testing.
 */
function createFakePlugin(overrides: Partial<A16nPlugin> = {}): A16nPlugin {
  return {
    id: 'test-source',
    name: 'Test Source',
    supports: [CustomizationType.GlobalPrompt],
    discover: async () => ({ items: [], warnings: [] }),
    emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    ...overrides,
  };
}

/**
 * Helper to create a fake AgentCustomization.
 */
function createItem(overrides: Partial<AgentCustomization> = {}): AgentCustomization {
  return {
    type: CustomizationType.GlobalPrompt,
    content: 'Test content',
    ...overrides,
  } as AgentCustomization;
}

/**
 * Helper to create a TransformationContext with defaults.
 */
function createContext(overrides: Partial<TransformationContext> = {}): TransformationContext {
  return {
    items: [],
    sourcePlugin: createFakePlugin({ id: 'cursor', pathPatterns: { prefixes: ['.cursor/rules/'], extensions: ['.mdc', '.md'] } }),
    targetPlugin: createFakePlugin({ id: 'claude', pathPatterns: { prefixes: ['.claude/rules/'], extensions: ['.md'] } }),
    sourceRoot: '/project',
    targetRoot: '/project',
    trialEmit: async () => ({ written: [], warnings: [], unsupported: [] }),
    ...overrides,
  };
}

describe('PathRewritingTransformation', () => {
  const transform = new PathRewritingTransformation();

  describe('identity', () => {
    it('should have correct id and name', () => {
      expect(transform.id).toBe('path-rewriting');
      expect(transform.name).toBe('Path Reference Rewriting');
    });
  });

  describe('no-op cases', () => {
    it('should return items unchanged when no items have content references', async () => {
      // Items with content that doesn't reference any source paths
      const items = [
        createItem({ content: 'No path references here' }),
      ];
      const context = createContext({ items });

      const result = await transform.transform(context);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.content).toBe('No path references here');
      expect(result.warnings).toHaveLength(0);
    });

    it('should return items unchanged when trial emit returns no written files', async () => {
      // Trial emit returns empty written array → no mapping → no rewriting
      const items = [
        createItem({ content: 'See .cursor/rules/foo.mdc' }),
      ];
      const context = createContext({
        items,
        trialEmit: async () => ({ written: [], warnings: [], unsupported: [] }),
      });

      const result = await transform.transform(context);
      expect(result.items).toHaveLength(1);
      // Content should be unchanged since there's no mapping
      expect(result.items[0]!.content).toContain('.cursor/rules/foo.mdc');
    });
  });

  describe('path rewriting', () => {
    it('should rewrite source paths to target paths using trial emit mapping', async () => {
      // Item references .cursor/rules/b.mdc
      const itemA = createItem({
        content: 'See .cursor/rules/b.mdc for details',
        sourcePath: '.cursor/rules/a.mdc',
      });
      const itemB = createItem({
        content: 'Rule B content',
        sourcePath: '.cursor/rules/b.mdc',
      });

      // Trial emit maps these to claude paths
      const writtenFiles: WrittenFile[] = [
        {
          path: '/project/.claude/rules/a.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [itemA],
        },
        {
          path: '/project/.claude/rules/b.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [itemB],
        },
      ];

      const context = createContext({
        items: [itemA, itemB],
        trialEmit: async () => ({ written: writtenFiles, warnings: [], unsupported: [] }),
      });

      const result = await transform.transform(context);
      expect(result.items[0]!.content).toContain('.claude/rules/b.md');
      expect(result.items[0]!.content).not.toContain('.cursor/rules/b.mdc');
    });

    it('should not mutate original items', async () => {
      const item = createItem({
        content: 'See .cursor/rules/b.mdc',
        sourcePath: '.cursor/rules/a.mdc',
      });
      const originalContent = item.content;

      const writtenFiles: WrittenFile[] = [
        {
          path: '/project/.claude/rules/b.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [createItem({ sourcePath: '.cursor/rules/b.mdc' })],
        },
      ];

      const context = createContext({
        items: [item],
        trialEmit: async () => ({ written: writtenFiles, warnings: [], unsupported: [] }),
      });

      await transform.transform(context);
      expect(item.content).toBe(originalContent);
    });
  });

  describe('orphan detection', () => {
    it('should detect orphan path references using source plugin pathPatterns', async () => {
      // Item references a cursor file that doesn't exist in the mapping
      const item = createItem({
        content: 'See .cursor/rules/nonexistent.mdc for help',
        sourcePath: '.cursor/rules/a.mdc',
      });

      // Trial emit returns the item itself but not the referenced file
      const writtenFiles: WrittenFile[] = [
        {
          path: '/project/.claude/rules/a.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [item],
        },
      ];

      const context = createContext({
        items: [item],
        trialEmit: async () => ({ written: writtenFiles, warnings: [], unsupported: [] }),
      });

      const result = await transform.transform(context);
      const orphanWarnings = result.warnings.filter((w) => w.code === WarningCode.OrphanPathRef);
      expect(orphanWarnings.length).toBeGreaterThanOrEqual(1);
      expect(orphanWarnings[0]!.message).toContain('.cursor/rules/nonexistent.mdc');
    });

    it('should not warn about paths that are in the mapping', async () => {
      // Item references a cursor file that IS in the mapping
      const itemA = createItem({
        content: 'See .cursor/rules/b.mdc for details',
        sourcePath: '.cursor/rules/a.mdc',
      });
      const itemB = createItem({
        content: 'Rule B',
        sourcePath: '.cursor/rules/b.mdc',
      });

      const writtenFiles: WrittenFile[] = [
        {
          path: '/project/.claude/rules/a.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [itemA],
        },
        {
          path: '/project/.claude/rules/b.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [itemB],
        },
      ];

      const context = createContext({
        items: [itemA, itemB],
        trialEmit: async () => ({ written: writtenFiles, warnings: [], unsupported: [] }),
      });

      const result = await transform.transform(context);
      const orphanWarnings = result.warnings.filter((w) => w.code === WarningCode.OrphanPathRef);
      expect(orphanWarnings).toHaveLength(0);
    });

    it('should skip orphan detection when source plugin has no pathPatterns', async () => {
      // Source plugin has no pathPatterns → no orphan detection
      const item = createItem({
        content: 'See .cursor/rules/nonexistent.mdc for help',
        sourcePath: '.cursor/rules/a.mdc',
      });

      const writtenFiles: WrittenFile[] = [
        {
          path: '/project/.claude/rules/a.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
          isNewFile: true,
          sourceItems: [item],
        },
      ];

      const context = createContext({
        items: [item],
        sourcePlugin: createFakePlugin({ id: 'custom' }), // No pathPatterns
        trialEmit: async () => ({ written: writtenFiles, warnings: [], unsupported: [] }),
      });

      const result = await transform.transform(context);
      const orphanWarnings = result.warnings.filter((w) => w.code === WarningCode.OrphanPathRef);
      expect(orphanWarnings).toHaveLength(0);
    });
  });

  describe('empty inputs', () => {
    it('should handle empty items array', async () => {
      const context = createContext({ items: [] });

      const result = await transform.transform(context);
      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
