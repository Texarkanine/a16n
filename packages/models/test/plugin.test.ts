import { describe, it, expect } from 'vitest';
import {
  CustomizationType,
  type A16nPlugin,
  type DiscoveryResult,
  type EmitResult,
  type WrittenFile,
} from '../src/index.js';

describe('A16nPlugin interface', () => {
  it('should define a valid plugin structure', () => {
    const mockPlugin: A16nPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      supports: [CustomizationType.GlobalPrompt],
      discover: async () => ({ items: [], warnings: [] }),
      emit: async () => ({ written: [], warnings: [], unsupported: [] }),
    };

    expect(mockPlugin.id).toBe('test-plugin');
    expect(mockPlugin.name).toBe('Test Plugin');
    expect(mockPlugin.supports).toContain(CustomizationType.GlobalPrompt);
    expect(typeof mockPlugin.discover).toBe('function');
    expect(typeof mockPlugin.emit).toBe('function');
  });
});

describe('DiscoveryResult', () => {
  it('should have items and warnings arrays', () => {
    const result: DiscoveryResult = {
      items: [
        {
          id: 'item-1',
          type: CustomizationType.GlobalPrompt,
          sourcePath: 'test.md',
          content: 'content',
          metadata: {},
        },
      ],
      warnings: [],
    };

    expect(result.items).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
  });
});

describe('EmitResult', () => {
  it('should have written, warnings, and unsupported arrays', () => {
    const result: EmitResult = {
      written: [
        {
          path: 'CLAUDE.md',
          type: CustomizationType.GlobalPrompt,
          itemCount: 1,
        },
      ],
      warnings: [],
      unsupported: [],
    };

    expect(result.written).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.unsupported).toHaveLength(0);
  });
});

describe('WrittenFile', () => {
  it('should track path, type, and itemCount', () => {
    const written: WrittenFile = {
      path: '.cursor/rules/generated.mdc',
      type: CustomizationType.GlobalPrompt,
      itemCount: 3,
      isNewFile: true,
    };

    expect(written.path).toBe('.cursor/rules/generated.mdc');
    expect(written.type).toBe(CustomizationType.GlobalPrompt);
    expect(written.itemCount).toBe(3);
    expect(written.isNewFile).toBe(true);
  });

  it('should track isNewFile as true for new files', () => {
    const written: WrittenFile = {
      path: 'CLAUDE.md',
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
      isNewFile: true,
    };

    expect(written.isNewFile).toBe(true);
  });

  it('should track isNewFile as false for edited files', () => {
    const written: WrittenFile = {
      path: 'CLAUDE.md',
      type: CustomizationType.GlobalPrompt,
      itemCount: 2,
      isNewFile: false,
    };

    expect(written.isNewFile).toBe(false);
  });

  it('should allow optional sourceItems field for tracking source customizations', () => {
    // Test that WrittenFile can include sourceItems field to track which
    // AgentCustomizations contributed to this output file
    const sourceItem = {
      id: 'source-1',
      type: CustomizationType.GlobalPrompt,
      sourcePath: '.cursor/rules/test.mdc',
      content: 'Test rule',
      metadata: {},
    };

    const written: WrittenFile = {
      path: 'CLAUDE.md',
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
      isNewFile: true,
      sourceItems: [sourceItem],
    };

    expect(written.sourceItems).toBeDefined();
    expect(written.sourceItems).toHaveLength(1);
    expect(written.sourceItems?.[0]).toBe(sourceItem);
  });

  it('should support WrittenFile with single source item (1:1 mapping)', () => {
    // Test that WrittenFile with itemCount=1 has single-element sourceItems array
    const sourceItem = {
      id: 'skill-1',
      type: CustomizationType.SimpleAgentSkill,
      sourcePath: '.cursor/rules/database.mdc',
      content: 'Database operations',
      metadata: {},
    };

    const written: WrittenFile = {
      path: '.claude/skills/database/SKILL.md',
      type: CustomizationType.SimpleAgentSkill,
      itemCount: 1,
      isNewFile: true,
      sourceItems: [sourceItem],
    };

    expect(written.itemCount).toBe(1);
    expect(written.sourceItems).toHaveLength(1);
    expect(written.sourceItems?.[0].id).toBe('skill-1');
  });

  it('should support WrittenFile with multiple source items (merged output)', () => {
    // Test that WrittenFile with itemCount>1 has multi-element sourceItems array
    const source1 = {
      id: 'ignore-1',
      type: CustomizationType.AgentIgnore,
      sourcePath: '.cursor/rules/build.mdc',
      content: '*.log',
      metadata: {},
    };
    const source2 = {
      id: 'ignore-2',
      type: CustomizationType.AgentIgnore,
      sourcePath: '.cursor/rules/temp.mdc',
      content: 'tmp/',
      metadata: {},
    };

    const written: WrittenFile = {
      path: '.cursorignore',
      type: CustomizationType.AgentIgnore,
      itemCount: 2,
      isNewFile: false,
      sourceItems: [source1, source2],
    };

    expect(written.itemCount).toBe(2);
    expect(written.sourceItems).toHaveLength(2);
    expect(written.sourceItems?.map(s => s.id)).toEqual(['ignore-1', 'ignore-2']);
  });

  it('should support WrittenFile without sourceItems for backwards compatibility', () => {
    // Test that WrittenFile can be created without sourceItems field
    // (optional field for backwards compatibility)
    const written: WrittenFile = {
      path: 'CLAUDE.md',
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
      isNewFile: true,
      // sourceItems intentionally omitted
    };

    expect(written.path).toBe('CLAUDE.md');
    expect(written.sourceItems).toBeUndefined();
  });
});
