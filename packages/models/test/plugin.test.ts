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
});
