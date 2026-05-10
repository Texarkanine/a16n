import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import cursorPlugin from '../src/index.js';
import {
  CustomizationType,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentIgnore,
  type ManualPrompt,
  createId,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'source-items');

describe('Cursor Plugin - sourceItems tracking', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should populate sourceItems for GlobalPrompt → .mdc (1:1)', async () => {
    // Test that WrittenFile for each GlobalPrompt .mdc includes
    // sourceItems array with single GlobalPrompt
    const gp: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, '.cursor/rules/test.mdc'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: '.cursor/rules/test.mdc',
      name: 'test',
      content: 'Test content',
      metadata: {},
    };

    const result = await cursorPlugin.emit([gp], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.GlobalPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(gp);
  });

  it('should populate sourceItems for FileRule → .mdc (1:1)', async () => {
    // Test that WrittenFile for each FileRule .mdc includes
    // sourceItems array with single FileRule
    const fr: FileRule = {
      id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: '.cursor/rules/react.mdc',
      content: 'React rules',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await cursorPlugin.emit([fr], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.FileRule);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(fr);
  });

  it('should populate sourceItems for SimpleAgentSkill → SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each SimpleAgentSkill SKILL.md includes
    // sourceItems array with single SimpleAgentSkill
    const skill: SimpleAgentSkill = {
      id: createId(CustomizationType.SimpleAgentSkill, '.cursor/rules/database.mdc'),
      type: CustomizationType.SimpleAgentSkill,
      name: 'database',
      sourcePath: '.cursor/rules/database.mdc',
      content: 'Database operations',
      description: 'Database helper',
      metadata: {},
    };

    const result = await cursorPlugin.emit([skill], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(skill);
  });

  it('should populate sourceItems for AgentIgnores → .cursorignore (merged)', async () => {
    // Test that WrittenFile for .cursorignore includes sourceItems
    // array containing all AgentIgnores that were merged
    const ignore1: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore1.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore1.mdc',
      content: '',
      patterns: ['*.log'],
      metadata: {},
    };
    const ignore2: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore2.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore2.mdc',
      content: '',
      patterns: ['tmp/'],
      metadata: {},
    };
    const ignore3: AgentIgnore = {
      id: createId(CustomizationType.AgentIgnore, 'ignore3.mdc'),
      type: CustomizationType.AgentIgnore,
      sourcePath: 'ignore3.mdc',
      content: '',
      patterns: ['*.tmp'],
      metadata: {},
    };

    const result = await cursorPlugin.emit([ignore1, ignore2, ignore3], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.AgentIgnore);
    expect(written?.itemCount).toBe(3);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(3);
    expect(written?.sourceItems).toContain(ignore1);
    expect(written?.sourceItems).toContain(ignore2);
    expect(written?.sourceItems).toContain(ignore3);
  });

  it('should populate sourceItems for ManualPrompt → .md (1:1)', async () => {
    const command: ManualPrompt = {
      id: createId(CustomizationType.ManualPrompt, '.cursor/commands/build.md'),
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/build.md',
      content: 'Build command content',
      promptName: 'build',
      metadata: {},
    };

    const result = await cursorPlugin.emit([command], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.ManualPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(command);

    // Verify it's written to .cursor/skills/<name>/SKILL.md (post Commands deprecation)
    expect(written?.path).toBe(path.join(tempDir, '.cursor', 'skills', 'build', 'SKILL.md'));
  });
});
