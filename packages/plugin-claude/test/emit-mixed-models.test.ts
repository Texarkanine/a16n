import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import claudePlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
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

describe('Mixed Model Emission', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should emit GlobalPrompt, FileRule, and SimpleAgentSkill together', async () => {
    const models = [
      {
        id: createId(CustomizationType.GlobalPrompt, 'global.mdc'),
        type: CustomizationType.GlobalPrompt,
        name: 'global',
        sourcePath: 'global.mdc',
        content: 'Global content',
        metadata: {},
      } as GlobalPrompt,
      {
        id: createId(CustomizationType.FileRule, 'react.mdc'),
        type: CustomizationType.FileRule,
        sourcePath: 'react.mdc',
        content: 'React content',
        globs: ['**/*.tsx'],
        metadata: {},
      } as FileRule,
      {
        id: createId(CustomizationType.SimpleAgentSkill, 'auth.mdc'),
        type: CustomizationType.SimpleAgentSkill,
        name: 'auth',
        sourcePath: 'auth.mdc',
        content: 'Auth content',
        description: 'Auth patterns',
        metadata: {},
      } as SimpleAgentSkill,
    ];

    const result = await claudePlugin.emit(models, tempDir);

    // Should have written all three types (3 files total)
    expect(result.written).toHaveLength(3);

    // Check GlobalPrompt → .claude/rules/global.md (no frontmatter)
    const globalRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'global.md'), 'utf-8');
    expect(globalRule).toContain('Global content');
    // TODO: tighten to `/^---\n/` — this regex only excludes `paths:` frontmatter,
    // not all frontmatter. Deferred out of this PR to keep assertion bodies
    // unchanged during the M4 structural split; see PR #94 review by CodeRabbit.
    expect(globalRule).not.toMatch(/^---\n.*paths:/s);

    // Check FileRule → .claude/rules/react.md (with paths frontmatter)
    const reactRule = await fs.readFile(path.join(tempDir, '.claude', 'rules', 'react.md'), 'utf-8');
    expect(reactRule).toContain('React content');
    expect(reactRule).toContain('paths:');
    expect(reactRule).toContain('**/*.tsx');

    // Check SimpleAgentSkill → .claude/skills/auth/SKILL.md
    const authSkill = await fs.readFile(path.join(tempDir, '.claude', 'skills', 'auth', 'SKILL.md'), 'utf-8');
    expect(authSkill).toContain('Auth content');

    // Verify NO settings.local.json created
    await expect(fs.access(path.join(tempDir, '.claude', 'settings.local.json'))).rejects.toThrow();

    // Verify NO .a16n directory created
    await expect(fs.access(path.join(tempDir, '.a16n'))).rejects.toThrow();
  });
});

