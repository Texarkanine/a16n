import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'mixed-models');

describe('Cursor Mixed Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should emit GlobalPrompt and FileRule to rules, SimpleAgentSkill to skills', async () => {
    const models = [
      {
        id: createId(CustomizationType.GlobalPrompt, 'global.md'),
        type: CustomizationType.GlobalPrompt,
        sourcePath: 'global.md',
        name: 'global',
        content: 'Global content',
        metadata: {},
      } as GlobalPrompt,
      {
        id: createId(CustomizationType.FileRule, 'react.md'),
        type: CustomizationType.FileRule,
        sourcePath: 'react.md',
        content: 'React content',
        globs: ['**/*.tsx'],
        metadata: {},
      } as FileRule,
      {
        id: createId(CustomizationType.SimpleAgentSkill, 'auth.md'),
        type: CustomizationType.SimpleAgentSkill,
        name: 'auth',
        sourcePath: 'auth.md',
        content: 'Auth content',
        description: 'Auth patterns',
        metadata: {},
      } as SimpleAgentSkill,
    ];

    const result = await cursorPlugin.emit(models, tempDir);

    expect(result.written).toHaveLength(3);

    // Read files from .cursor/rules (GlobalPrompt + FileRule)
    const rulesFiles = await fs.readdir(path.join(tempDir, '.cursor', 'rules'));
    expect(rulesFiles).toHaveLength(2);

    // Check we have one with alwaysApply (GlobalPrompt) and one with globs (FileRule)
    const rulesContents = await Promise.all(
      rulesFiles.map(f => fs.readFile(path.join(tempDir, '.cursor', 'rules', f), 'utf-8'))
    );
    expect(rulesContents.some(c => c.includes('alwaysApply: true'))).toBe(true);
    expect(rulesContents.some(c => c.includes('globs:'))).toBe(true);

    // Check SimpleAgentSkill in .cursor/skills
    const skillPath = path.join(tempDir, '.cursor', 'skills', 'auth', 'SKILL.md');
    const skillContent = await fs.readFile(skillPath, 'utf-8');
    expect(skillContent).toContain('description:');
    expect(skillContent).toContain('Auth patterns');
  });
});
