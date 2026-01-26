import { describe, it, expect } from 'vitest';
import {
  CustomizationType,
  isGlobalPrompt,
  isAgentSkill,
  isFileRule,
  isAgentIgnore,
  isAgentCommand,
  getUniqueFilename,
  createId,
  type AgentCustomization,
  type GlobalPrompt,
  type AgentSkill,
  type FileRule,
  type AgentIgnore,
  type AgentCommand,
} from '../src/index.js';

describe('isGlobalPrompt', () => {
  it('should return true for GlobalPrompt', () => {
    const item: GlobalPrompt = {
      id: 'test',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isGlobalPrompt(item)).toBe(true);
  });

  it('should return false for other types', () => {
    const item: AgentCustomization = {
      id: 'test',
      type: CustomizationType.AgentSkill,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isGlobalPrompt(item)).toBe(false);
  });
});

describe('isAgentSkill', () => {
  it('should return true for AgentSkill', () => {
    const item: AgentSkill = {
      id: 'test',
      type: CustomizationType.AgentSkill,
      sourcePath: 'test.md',
      content: 'content',
      description: 'Test skill',
      metadata: {},
    };

    expect(isAgentSkill(item)).toBe(true);
  });

  it('should return false for other types', () => {
    const item: AgentCustomization = {
      id: 'test',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isAgentSkill(item)).toBe(false);
  });
});

describe('isFileRule', () => {
  it('should return true for FileRule', () => {
    const item: FileRule = {
      id: 'test',
      type: CustomizationType.FileRule,
      sourcePath: 'test.md',
      content: 'content',
      globs: ['**/*.ts'],
      metadata: {},
    };

    expect(isFileRule(item)).toBe(true);
  });

  it('should return false for other types', () => {
    const item: AgentCustomization = {
      id: 'test',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isFileRule(item)).toBe(false);
  });
});

describe('isAgentIgnore', () => {
  it('should return true for AgentIgnore', () => {
    const item: AgentIgnore = {
      id: 'test',
      type: CustomizationType.AgentIgnore,
      sourcePath: '.cursorignore',
      content: 'node_modules',
      patterns: ['node_modules/**'],
      metadata: {},
    };

    expect(isAgentIgnore(item)).toBe(true);
  });

  it('should return false for other types', () => {
    const item: AgentCustomization = {
      id: 'test',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isAgentIgnore(item)).toBe(false);
  });
});

describe('isAgentCommand', () => {
  it('should return true for AgentCommand', () => {
    const item: AgentCommand = {
      id: 'test',
      type: CustomizationType.AgentCommand,
      sourcePath: '.cursor/commands/review.md',
      content: 'Review code',
      commandName: 'review',
      metadata: {},
    };

    expect(isAgentCommand(item)).toBe(true);
  });

  it('should return false for other types', () => {
    const item: AgentCustomization = {
      id: 'test',
      type: CustomizationType.GlobalPrompt,
      sourcePath: 'test.md',
      content: 'content',
      metadata: {},
    };

    expect(isAgentCommand(item)).toBe(false);
  });
});

describe('getUniqueFilename', () => {
  it('should return base name when not in used set', () => {
    const usedNames = new Set<string>();
    const result = getUniqueFilename('test', usedNames);

    expect(result).toBe('test');
    expect(usedNames.has('test')).toBe(true);
  });

  it('should append counter when name already exists', () => {
    const usedNames = new Set(['test']);
    const result = getUniqueFilename('test', usedNames);

    expect(result).toBe('test-1');
    expect(usedNames.has('test-1')).toBe(true);
  });

  it('should increment counter for multiple collisions', () => {
    const usedNames = new Set(['test', 'test-1', 'test-2']);
    const result = getUniqueFilename('test', usedNames);

    expect(result).toBe('test-3');
    expect(usedNames.has('test-3')).toBe(true);
  });

  it('should handle extension parameter', () => {
    const usedNames = new Set<string>();
    const result = getUniqueFilename('rule', usedNames, '.txt');

    expect(result).toBe('rule.txt');
    expect(usedNames.has('rule.txt')).toBe(true);
  });

  it('should handle extension with collisions', () => {
    const usedNames = new Set(['rule.txt']);
    const result = getUniqueFilename('rule', usedNames, '.txt');

    expect(result).toBe('rule-1.txt');
    expect(usedNames.has('rule-1.txt')).toBe(true);
  });

  it('should mutate the usedNames set', () => {
    const usedNames = new Set<string>();
    getUniqueFilename('a', usedNames);
    getUniqueFilename('b', usedNames);
    getUniqueFilename('a', usedNames);

    expect(usedNames).toEqual(new Set(['a', 'b', 'a-1']));
  });
});

describe('createId', () => {
  it('should create an ID from type and source path', () => {
    const id = createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc');

    expect(id).toBe('global-prompt:.cursor/rules/test.mdc');
  });

  it('should work with different types', () => {
    expect(createId(CustomizationType.AgentSkill, 'skill.md')).toBe('agent-skill:skill.md');
    expect(createId(CustomizationType.FileRule, 'rule.mdc')).toBe('file-rule:rule.mdc');
    expect(createId(CustomizationType.AgentIgnore, '.ignore')).toBe('agent-ignore:.ignore');
    expect(createId(CustomizationType.AgentCommand, 'command.md')).toBe('agent-command:command.md');
  });
});
