import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import cursorPlugin from '../src/index.js';
import { CustomizationType } from '@a16n/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('Cursor Plugin Discovery', () => {
  describe('basic .mdc file', () => {
    it('should discover a single GlobalPrompt from alwaysApply: true rule', async () => {
      const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.items[0]?.sourcePath).toBe('.cursor/rules/general.mdc');
      expect(result.items[0]?.content).toContain('Use TypeScript for all new files');
      expect(result.items[0]?.content).toContain('Prefer functional components');
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('multiple .mdc files', () => {
    it('should discover all GlobalPrompt items from multiple files', async () => {
      const root = path.join(fixturesDir, 'cursor-multiple/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(3);
      
      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/style.mdc');
      expect(sourcePaths).toContain('.cursor/rules/testing.mdc');
      expect(sourcePaths).toContain('.cursor/rules/patterns.mdc');
    });
  });

  describe('empty project', () => {
    it('should return empty items for project with no rules', async () => {
      const root = path.join(fixturesDir, 'cursor-empty/from-cursor');
      const result = await cursorPlugin.discover(root);

      expect(result.items).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('nested subdirectories', () => {
    it('should discover rules in subdirectories like shared/ and local/', async () => {
      const root = path.join(fixturesDir, 'cursor-nested/from-cursor');
      const result = await cursorPlugin.discover(root);

      // Should find 3 rules: root.mdc, shared/core.mdc, local/project.mdc
      expect(result.items).toHaveLength(3);

      // All should be GlobalPrompt
      for (const item of result.items) {
        expect(item.type).toBe(CustomizationType.GlobalPrompt);
      }

      // Check we got all three files with correct paths
      const sourcePaths = result.items.map(i => i.sourcePath);
      expect(sourcePaths).toContain('.cursor/rules/root.mdc');
      expect(sourcePaths).toContain('.cursor/rules/shared/core.mdc');
      expect(sourcePaths).toContain('.cursor/rules/local/project.mdc');
    });
  });
});

describe('MDC Parsing', () => {
  it('should parse frontmatter correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    expect(item?.metadata).toHaveProperty('alwaysApply', true);
  });

  it('should extract body content without frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    const item = result.items[0];
    // Content should not include the frontmatter delimiters
    expect(item?.content).not.toContain('---');
    expect(item?.content).not.toContain('alwaysApply');
  });
});

describe('FileRule Discovery (Phase 2)', () => {
  it('should discover FileRule items from rules with globs: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);
    
    // All should be FileRule
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should parse single glob pattern correctly', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const tsRule = result.items.find(i => i.sourcePath.includes('typescript'));
    expect(tsRule).toBeDefined();
    expect(tsRule?.type).toBe(CustomizationType.FileRule);
    expect((tsRule as import('@a16n/models').FileRule).globs).toEqual(['**/*.ts']);
  });

  it('should parse comma-separated glob patterns into array', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule).toBeDefined();
    expect(reactRule?.type).toBe(CustomizationType.FileRule);
    expect((reactRule as import('@a16n/models').FileRule).globs).toEqual(['**/*.tsx', '**/*.jsx']);
  });

  it('should include rule content in FileRule items', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    const reactRule = result.items.find(i => i.sourcePath.includes('react'));
    expect(reactRule?.content).toContain('Use React best practices');
  });
});

describe('AgentSkill Discovery (Phase 2)', () => {
  it('should discover AgentSkill items from rules with description: frontmatter', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(2);
    
    // All should be AgentSkill
    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.AgentSkill);
    }
  });

  it('should extract description from frontmatter without quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill).toBeDefined();
    expect(authSkill?.type).toBe(CustomizationType.AgentSkill);
    expect((authSkill as import('@a16n/models').AgentSkill).description).toBe('Authentication and authorization patterns');
  });

  it('should extract description from frontmatter with quotes', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const dbSkill = result.items.find(i => i.sourcePath.includes('database'));
    expect(dbSkill).toBeDefined();
    expect(dbSkill?.type).toBe(CustomizationType.AgentSkill);
    expect((dbSkill as import('@a16n/models').AgentSkill).description).toBe('Database operations and ORM usage');
  });

  it('should include rule content in AgentSkill items', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    const authSkill = result.items.find(i => i.sourcePath.includes('auth'));
    expect(authSkill?.content).toContain('Use JWT for stateless authentication');
  });
});

describe('Classification Priority (Phase 2)', () => {
  it('should prioritize alwaysApply: true as GlobalPrompt', async () => {
    const root = path.join(fixturesDir, 'cursor-basic/from-cursor');
    const result = await cursorPlugin.discover(root);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.type).toBe(CustomizationType.GlobalPrompt);
  });

  it('should classify rules with globs as FileRule', async () => {
    const root = path.join(fixturesDir, 'cursor-filerule/from-cursor');
    const result = await cursorPlugin.discover(root);

    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.FileRule);
    }
  });

  it('should classify rules with description (no globs) as AgentSkill', async () => {
    const root = path.join(fixturesDir, 'cursor-agentskill/from-cursor');
    const result = await cursorPlugin.discover(root);

    for (const item of result.items) {
      expect(item.type).toBe(CustomizationType.AgentSkill);
    }
  });
});
