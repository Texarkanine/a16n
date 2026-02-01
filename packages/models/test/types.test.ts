import { describe, it, expect } from 'vitest';
import {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
  type ManualPrompt,
  type SimpleAgentSkill,
  type AgentSkill,
  type AgentSkillIO,
} from '../src/index.js';

describe('CustomizationType', () => {
  it('should have GlobalPrompt type', () => {
    expect(CustomizationType.GlobalPrompt).toBe('global-prompt');
  });

  it('should have SimpleAgentSkill type (renamed from AgentSkill)', () => {
    expect(CustomizationType.SimpleAgentSkill).toBe('simple-agent-skill');
  });

  it('should have AgentSkillIO type', () => {
    expect(CustomizationType.AgentSkillIO).toBe('agent-skill-io');
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

describe('SimpleAgentSkill', () => {
  /**
   * Tests for SimpleAgentSkill type (renamed from AgentSkill).
   * Verifies the type exists with the correct enum value.
   */

  it('should have SimpleAgentSkill type in CustomizationType', () => {
    expect(CustomizationType.SimpleAgentSkill).toBe('simple-agent-skill');
  });

  it('should be an AgentCustomization with SimpleAgentSkill type', () => {
    const skill: SimpleAgentSkill = {
      id: 'skill-1',
      type: CustomizationType.SimpleAgentSkill,
      sourcePath: '.cursor/rules/auth.mdc',
      content: 'Authentication helper',
      description: 'Helps with authentication',
      metadata: {},
    };

    expect(skill.type).toBe(CustomizationType.SimpleAgentSkill);
    expect(skill.description).toBe('Helps with authentication');
  });
});

describe('AgentSkill (deprecated alias)', () => {
  /**
   * Tests for backward compatibility.
   * The AgentSkill type alias should work identically to SimpleAgentSkill.
   */

  it('should work as an alias for SimpleAgentSkill', () => {
    // AgentSkill is a deprecated alias for SimpleAgentSkill
    // This verifies the type alias compiles correctly
    const skill: AgentSkill = {
      id: 'skill-1',
      type: CustomizationType.SimpleAgentSkill,
      sourcePath: '.cursor/rules/test.mdc',
      content: 'Test content',
      description: 'Test description',
      metadata: {},
    };

    expect(skill.type).toBe(CustomizationType.SimpleAgentSkill);
    expect(skill.description).toBe('Test description');
  });
});

describe('AgentSkillIO', () => {
  /**
   * Tests for the new AgentSkillIO type.
   * This type supports full AgentSkills.io standard with hooks, resources, and files.
   */

  it('should have AgentSkillIO type in CustomizationType', () => {
    expect(CustomizationType.AgentSkillIO).toBe('agent-skill-io');
  });

  it('should be an AgentCustomization with AgentSkillIO type', () => {
    const skill: AgentSkillIO = {
      id: 'skillIO-1',
      type: CustomizationType.AgentSkillIO,
      sourcePath: '.claude/skills/deploy/SKILL.md',
      content: 'Deploy skill content',
      name: 'deploy',
      description: 'Deploy to production',
      files: {},
      metadata: {},
    };

    expect(skill.type).toBe(CustomizationType.AgentSkillIO);
    expect(skill.name).toBe('deploy');
    expect(skill.description).toBe('Deploy to production');
  });

  it('should support hooks field', () => {
    const skill: AgentSkillIO = {
      id: 'skillIO-2',
      type: CustomizationType.AgentSkillIO,
      sourcePath: '.claude/skills/secure-deploy/SKILL.md',
      content: 'Secure deploy content',
      name: 'secure-deploy',
      description: 'Secure deployment',
      hooks: {
        'pre-commit': { command: 'npm test' },
        'post-deploy': { notify: true },
      },
      files: {},
      metadata: {},
    };

    expect(skill.hooks).toBeDefined();
    expect(skill.hooks!['pre-commit']).toEqual({ command: 'npm test' });
  });

  it('should support resources field', () => {
    const skill: AgentSkillIO = {
      id: 'skillIO-3',
      type: CustomizationType.AgentSkillIO,
      sourcePath: '.cursor/skills/review/SKILL.md',
      content: 'Review content',
      name: 'review',
      description: 'Code review',
      resources: ['checklist.md', 'config.json'],
      files: {},
      metadata: {},
    };

    expect(skill.resources).toBeDefined();
    expect(skill.resources).toContain('checklist.md');
    expect(skill.resources).toContain('config.json');
  });

  it('should support files field', () => {
    const skill: AgentSkillIO = {
      id: 'skillIO-4',
      type: CustomizationType.AgentSkillIO,
      sourcePath: '.cursor/skills/deploy/SKILL.md',
      content: 'Deploy content',
      name: 'deploy',
      description: 'Deploy skill',
      files: {
        'checklist.md': '# Deployment Checklist\n- [ ] Run tests',
        'config.json': '{"env": "production"}',
      },
      metadata: {},
    };

    expect(skill.files).toBeDefined();
    expect(skill.files['checklist.md']).toContain('Deployment Checklist');
    expect(skill.files['config.json']).toContain('production');
  });

  it('should support disableModelInvocation field', () => {
    const skill: AgentSkillIO = {
      id: 'skillIO-5',
      type: CustomizationType.AgentSkillIO,
      sourcePath: '.claude/skills/manual/SKILL.md',
      content: 'Manual-only skill',
      name: 'manual',
      description: 'Manual invocation only',
      disableModelInvocation: true,
      files: {},
      metadata: {},
    };

    expect(skill.disableModelInvocation).toBe(true);
  });
});
