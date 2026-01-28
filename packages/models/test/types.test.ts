import { describe, it, expect } from 'vitest';
import {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
  type ManualPrompt,
  type AgentCommand,
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

  it('should have ManualPrompt type', () => {
    expect(CustomizationType.ManualPrompt).toBe('manual-prompt');
  });

  it('should have deprecated AgentCommand alias pointing to ManualPrompt', () => {
    // AgentCommand is deprecated but should still work for backward compatibility
    expect(CustomizationType.AgentCommand).toBe('manual-prompt');
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

describe('ManualPrompt', () => {
  it('should be an AgentCustomization with ManualPrompt type', () => {
    const manualPrompt: ManualPrompt = {
      id: 'mp-1',
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/skills/review/SKILL.md',
      content: 'Review the code',
      promptName: 'review',
      metadata: {},
    };

    expect(manualPrompt.type).toBe(CustomizationType.ManualPrompt);
    expect(manualPrompt.promptName).toBe('review');
  });

  it('should have promptName field (not commandName)', () => {
    const manualPrompt: ManualPrompt = {
      id: 'mp-2',
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/deploy.md',
      content: 'Deploy to production',
      promptName: 'deploy',
      metadata: {},
    };

    expect(manualPrompt).toHaveProperty('promptName');
    expect(manualPrompt.promptName).toBe('deploy');
  });
});

describe('AgentCommand (deprecated alias)', () => {
  it('should be assignable to ManualPrompt for backward compatibility', () => {
    // AgentCommand is a deprecated type alias for ManualPrompt
    const command: AgentCommand = {
      id: 'ac-1',
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/test.md',
      content: 'Test command',
      promptName: 'test',
      metadata: {},
    };

    // Should be assignable to ManualPrompt
    const prompt: ManualPrompt = command;
    expect(prompt.type).toBe(CustomizationType.ManualPrompt);
  });
});
