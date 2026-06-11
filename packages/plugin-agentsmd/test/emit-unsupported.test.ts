import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import {
  CustomizationType,
  createId,
  type AgentCustomization,
  type GlobalPrompt,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'unsupported');

describe('AGENTS.md Plugin Emission (unsupported types)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should return skills, manual prompts, and ignores as unsupported without writing files', async () => {
    const models: AgentCustomization[] = [
      {
        id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/skill.mdc'),
        type: CustomizationType.SimpleAgentSkill,
        sourcePath: '.cursor/rules/skill.mdc',
        content: 'Skill content',
        name: 'skill',
        description: 'A skill',
        metadata: {},
      } as AgentCustomization,
      {
        id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/big/SKILL.md'),
        type: CustomizationType.AgentSkillIO,
        sourcePath: '.cursor/skills/big/SKILL.md',
        content: 'Big skill',
        name: 'big',
        description: 'Big skill',
        files: { 'scripts/run.sh': 'echo hi' },
        metadata: {},
      } as AgentCustomization,
      {
        id: createId(CustomizationType.ManualPrompt, '.cursor/commands/go.md'),
        type: CustomizationType.ManualPrompt,
        sourcePath: '.cursor/commands/go.md',
        content: 'Go!',
        promptName: 'go',
        metadata: {},
      } as AgentCustomization,
      {
        id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
        type: CustomizationType.AgentIgnore,
        sourcePath: '.cursorignore',
        content: 'dist/',
        patterns: ['dist/'],
        metadata: {},
      } as AgentCustomization,
    ];

    const result = await agentsmdPlugin.emit(models, tempDir);

    expect(result.written).toHaveLength(0);
    expect(result.unsupported).toHaveLength(4);
    expect(result.warnings).toHaveLength(0);
    await expect(fs.access(path.join(tempDir, 'AGENTS.md'))).rejects.toThrow();
  });

  it('should emit supported items while returning unsupported ones', async () => {
    const gp: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
      type: CustomizationType.GlobalPrompt,
      name: 'CLAUDE',
      sourcePath: 'CLAUDE.md',
      content: 'Global content.',
      metadata: {},
    };
    const skill: AgentCustomization = {
      id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/skill.mdc'),
      type: CustomizationType.SimpleAgentSkill,
      sourcePath: '.cursor/rules/skill.mdc',
      content: 'Skill content',
      name: 'skill',
      description: 'A skill',
      metadata: {},
    } as AgentCustomization;

    const result = await agentsmdPlugin.emit([gp, skill], tempDir);

    expect(result.written).toHaveLength(1);
    expect(result.unsupported).toHaveLength(1);
    expect(result.unsupported[0]!.type).toBe(CustomizationType.SimpleAgentSkill);

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(content).toBe('Global content.\n');
  });
});
