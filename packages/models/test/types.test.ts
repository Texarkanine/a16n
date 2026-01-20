import { describe, it, expect } from 'vitest';
import {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
} from '../src/index.js';

describe('CustomizationType', () => {
  it('should have GlobalPrompt type', () => {
    expect(CustomizationType.GlobalPrompt).toBe('global-prompt');
  });

  it('should have AgentSkill type', () => {
    expect(CustomizationType.AgentSkill).toBe('agent-skill');
  });

  it('should have FileRule type', () => {
    expect(CustomizationType.FileRule).toBe('file-rule');
  });

  it('should have AgentIgnore type', () => {
    expect(CustomizationType.AgentIgnore).toBe('agent-ignore');
  });
});

describe('AgentCustomization', () => {
  it('should allow creating a valid customization object', () => {
    const customization: AgentCustomization = {
      id: 'test-id',
      type: CustomizationType.GlobalPrompt,
      sourcePath: '.cursor/rules/test.mdc',
      content: 'Test content',
      metadata: { key: 'value' },
    };

    expect(customization.id).toBe('test-id');
    expect(customization.type).toBe(CustomizationType.GlobalPrompt);
    expect(customization.sourcePath).toBe('.cursor/rules/test.mdc');
    expect(customization.content).toBe('Test content');
    expect(customization.metadata).toEqual({ key: 'value' });
  });
});

describe('GlobalPrompt', () => {
  it('should be an AgentCustomization with GlobalPrompt type', () => {
    const globalPrompt: GlobalPrompt = {
      id: 'gp-1',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'CLAUDE.md',
      content: 'Always use TypeScript',
      metadata: {},
    };

    expect(globalPrompt.type).toBe(CustomizationType.GlobalPrompt);
  });
});
