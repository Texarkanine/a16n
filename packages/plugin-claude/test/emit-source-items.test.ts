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

const tempDir = suiteTempDir(import.meta.url, 'source-items');

describe('Claude Plugin - sourceItems tracking', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should populate sourceItems for each GlobalPrompt → .claude/rules/*.md (1:1)', async () => {
    // Test that WrittenFile for each .claude/rules/*.md includes
    // sourceItems array with single GlobalPrompt
    const gp1: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule1.mdc'),
      type: CustomizationType.GlobalPrompt,
      name: 'rule1',
      sourcePath: 'rule1.mdc',
      content: 'Rule 1',
      metadata: {},
    };
    const gp2: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule2.mdc'),
      type: CustomizationType.GlobalPrompt,
      name: 'rule2',
      sourcePath: 'rule2.mdc',
      content: 'Rule 2',
      metadata: {},
    };
    const gp3: GlobalPrompt = {
      id: createId(CustomizationType.GlobalPrompt, 'rule3.mdc'),
      type: CustomizationType.GlobalPrompt,
      name: 'rule3',
      sourcePath: 'rule3.mdc',
      content: 'Rule 3',
      metadata: {},
    };

    const result = await claudePlugin.emit([gp1, gp2, gp3], tempDir);

    // BREAKING: Each GlobalPrompt gets its own file
    expect(result.written).toHaveLength(3);
    
    // Each written file should have 1:1 sourceItems mapping
    result.written.forEach(written => {
      expect(written.type).toBe(CustomizationType.GlobalPrompt);
      expect(written.itemCount).toBe(1);
      expect(written.sourceItems).toBeDefined();
      expect(written.sourceItems).toHaveLength(1);
    });

    // Verify each sourceItem is one of the original items
    const sourceItems = result.written.flatMap(w => w.sourceItems || []);
    expect(sourceItems).toContain(gp1);
    expect(sourceItems).toContain(gp2);
    expect(sourceItems).toContain(gp3);
  });

  it('should populate sourceItems for FileRule → .claude/rules/*.md (1:1)', async () => {
    // Test that WrittenFile for each .claude/rules/*.md includes
    // sourceItems array with single FileRule
    const rule: FileRule = {
      id: createId(CustomizationType.FileRule, '.cursor/rules/react.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: '.cursor/rules/react.mdc',
      content: 'React rules',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await claudePlugin.emit([rule], tempDir);

    // BREAKING: Should have 1 written file (no settings.local.json)
    expect(result.written).toHaveLength(1);
    
    const ruleFile = result.written[0];
    expect(ruleFile).toBeDefined();
    expect(ruleFile?.type).toBe(CustomizationType.FileRule);
    expect(ruleFile?.itemCount).toBe(1);
    expect(ruleFile?.sourceItems).toBeDefined();
    expect(ruleFile?.sourceItems).toHaveLength(1);
    expect(ruleFile?.sourceItems?.[0]).toBe(rule);
  });

  it('should populate sourceItems for each FileRule → .claude/rules/*.md (multiple)', async () => {
    // Test that each FileRule gets its own file with 1:1 sourceItems mapping
    const rule1: FileRule = {
      id: createId(CustomizationType.FileRule, 'rule1.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: 'rule1.mdc',
      content: 'Rule 1',
      globs: ['**/*.ts'],
      metadata: {},
    };
    const rule2: FileRule = {
      id: createId(CustomizationType.FileRule, 'rule2.mdc'),
      type: CustomizationType.FileRule,
      sourcePath: 'rule2.mdc',
      content: 'Rule 2',
      globs: ['**/*.tsx'],
      metadata: {},
    };

    const result = await claudePlugin.emit([rule1, rule2], tempDir);

    // BREAKING: Should have 2 written files (no settings.local.json)
    expect(result.written).toHaveLength(2);
    
    // Each file should have 1:1 sourceItems mapping
    result.written.forEach(written => {
      expect(written.type).toBe(CustomizationType.FileRule);
      expect(written.itemCount).toBe(1);
      expect(written.sourceItems).toBeDefined();
      expect(written.sourceItems).toHaveLength(1);
    });

    // Verify each sourceItem is one of the original items
    const sourceItems = result.written.flatMap(w => w.sourceItems || []);
    expect(sourceItems).toContain(rule1);
    expect(sourceItems).toContain(rule2);
  });

  it('should populate sourceItems for SimpleAgentSkill → .claude/skills/*/SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each skill SKILL.md includes
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

    const result = await claudePlugin.emit([skill], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.SimpleAgentSkill);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(skill);
  });

  it('should populate sourceItems for AgentIgnores → settings.json (merged)', async () => {
    // Test that WrittenFile for settings.json includes sourceItems
    // array containing all AgentIgnores that were processed
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

    const result = await claudePlugin.emit([ignore1, ignore2], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.AgentIgnore);
    expect(written?.itemCount).toBe(2);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(2);
    expect(written?.sourceItems).toContain(ignore1);
    expect(written?.sourceItems).toContain(ignore2);
  });

  it('should populate sourceItems for ManualPrompt → .claude/skills/*/SKILL.md (1:1)', async () => {
    // Test that WrittenFile for each prompt SKILL.md includes
    // sourceItems array with single ManualPrompt
    const prompt: ManualPrompt = {
      id: createId(CustomizationType.ManualPrompt, '.cursor/commands/build.md'),
      type: CustomizationType.ManualPrompt,
      sourcePath: '.cursor/commands/build.md',
      content: 'Build command content',
      promptName: 'build',
      metadata: {},
    };

    const result = await claudePlugin.emit([prompt], tempDir);

    expect(result.written).toHaveLength(1);
    const written = result.written[0];
    expect(written?.type).toBe(CustomizationType.ManualPrompt);
    expect(written?.itemCount).toBe(1);
    expect(written?.sourceItems).toBeDefined();
    expect(written?.sourceItems).toHaveLength(1);
    expect(written?.sourceItems?.[0]).toBe(prompt);
  });
});

