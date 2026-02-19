import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import a16nPlugin from '../src/index.js';
import {
  CustomizationType,
  type AgentCustomization,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type AgentIgnore,
  type ManualPrompt,
  createId,
  CURRENT_IR_VERSION,
} from '@a16njs/models';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use a temp directory for emission tests
const tempDir = path.join(__dirname, '.temp-emit-test');

describe('A16n Plugin Emission', () => {
  beforeEach(async () => {
    // Create temp directory
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('GlobalPrompt emission', () => {
    it('should emit GlobalPrompt to .a16n/global-prompt/ with IR frontmatter', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'coding-standards'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: '.cursor/rules/coding-standards.mdc', // Should NOT appear in output
          content: '# Coding Standards\n\nAlways use TypeScript strict mode.',
          metadata: { tool: 'cursor' }, // Should NOT appear in output
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      expect(result.warnings).toHaveLength(0);
      expect(result.unsupported).toHaveLength(0);

      // Verify file was created in correct directory with correct name
      const expectedPath = path.join(tempDir, '.a16n', 'global-prompt', 'coding-standards.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      // Verify frontmatter contains version and type
      expect(content).toContain('version: v1beta2');
      expect(content).toContain('type: global-prompt');
      
      // Verify content is present
      expect(content).toContain('# Coding Standards');
      expect(content).toContain('Always use TypeScript strict mode.');
      
      // Verify metadata and sourcePath are NOT in frontmatter
      expect(content).not.toContain('metadata:');
      expect(content).not.toContain('sourcePath:');
      expect(content).not.toContain('.cursor/rules/coding-standards.mdc');
    });

    it('should create subdirectories from relativeDir field', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'nested-rule'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Nested rule content',
          metadata: {},
          relativeDir: 'foo/bar', // Should create .a16n/global-prompt/foo/bar/
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      // Verify file was created in nested directory
      const expectedPath = path.join(tempDir, '.a16n', 'global-prompt', 'foo', 'bar', 'nested-rule.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      // Verify relativeDir is in frontmatter
      expect(content).toContain('relativeDir: foo/bar');
      expect(content).toContain('Nested rule content');
    });
  });

  describe('FileRule emission', () => {
    it('should emit FileRule to .a16n/file-rule/ with globs in frontmatter', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'typescript-style'),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          globs: ['**/*.ts', '**/*.tsx'],
          content: '# TypeScript Style\n\nUse explicit return types.',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      const expectedPath = path.join(tempDir, '.a16n', 'file-rule', 'typescript-style.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      // Verify frontmatter contains globs
      expect(content).toContain('globs:');
      expect(content).toContain('**/*.ts');
      expect(content).toContain('**/*.tsx');
      expect(content).toContain('type: file-rule');
      expect(content).toContain('Use explicit return types.');
    });

    it('should create subdirectories from relativeDir field', async () => {
      const models: FileRule[] = [
        {
          id: createId(CustomizationType.FileRule, 'nested-filerule'),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          globs: ['**/*.js'],
          content: 'JavaScript rules',
          metadata: {},
          relativeDir: 'frontend',
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      const expectedPath = path.join(tempDir, '.a16n', 'file-rule', 'frontend', 'nested-filerule.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      expect(content).toContain('relativeDir: frontend');
      expect(content).toContain('globs:');
    });
  });

  describe('SimpleAgentSkill emission', () => {
    it('should emit SimpleAgentSkill to .a16n/simple-agent-skill/ with description', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'deploy-helper'),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          name: 'deploy-helper',
          description: 'Deploy application to production',
          content: '# Deploy Helper\n\nInstructions for deployment.',
          metadata: { name: 'custom-name' }, // Should NOT appear in frontmatter
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      const expectedPath = path.join(tempDir, '.a16n', 'simple-agent-skill', 'deploy-helper.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      // Verify frontmatter contains description
      expect(content).toContain('description: Deploy application to production');
      expect(content).toContain('type: simple-agent-skill');
      
      // Verify NO metadata in frontmatter (metadata is transient)
      expect(content).not.toContain('custom-name');
      expect(content).not.toContain('metadata:');
    });

    it('should use skill.name for filename when present', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/skills/banana/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          name: 'banana',
          description: 'Helps you visualize yellow fruits',
          content: 'Print a banana emoji.',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      const expectedPath = path.join(tempDir, '.a16n', 'simple-agent-skill', 'banana.md');
      const content = await fs.readFile(expectedPath, 'utf-8');

      expect(content).toContain('name: banana');
      expect(content).toContain('description: Helps you visualize yellow fruits');
      expect(content).toContain('Print a banana emoji.');
    });

    it('should serialize name in IR frontmatter when present', async () => {
      const models: SimpleAgentSkill[] = [
        {
          id: createId(CustomizationType.SimpleAgentSkill, '.cursor/skills/deploy/SKILL.md'),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          name: 'deploy',
          description: 'Deploy helper',
          content: 'Deploy instructions.',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      const expectedPath = path.join(tempDir, '.a16n', 'simple-agent-skill', 'deploy.md');
      const content = await fs.readFile(expectedPath, 'utf-8');

      expect(content).toContain('name: deploy');
      expect(content).toContain('description: Deploy helper');
    });
  });

  describe('AgentSkillIO emission', () => {
    it('should emit AgentSkillIO to .a16n/agent-skill-io/<name>/ with verbatim format', async () => {
      // Use a realistic ID matching real discovery output — directory name
      // should come from item.name, not from extracting/slugifying the ID
      const models: AgentSkillIO[] = [
        {
          id: createId(CustomizationType.AgentSkillIO, '.cursor/skills/database-helper/SKILL.md'),
          type: CustomizationType.AgentSkillIO,
          version: CURRENT_IR_VERSION,
          sourcePath: '.cursor/skills/database-helper/SKILL.md',
          name: 'database-helper',
          description: 'Database operations helper',
          content: '# Database Helper\n\nHandle DB migrations.',
          files: {
            'schema.sql': 'CREATE TABLE users...',
          },
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Verify directory name comes from item.name, not mangled ID
      const skillDir = path.join(tempDir, '.a16n', 'agent-skill-io', 'database-helper');
      const skillFile = path.join(skillDir, 'SKILL.md');
      const content = await fs.readFile(skillFile, 'utf-8');

      // Verify verbatim AgentSkills.io format (NO IR frontmatter, NO version field)
      expect(content).toContain('name: database-helper');
      expect(content).toContain('description: Database operations helper');
      expect(content).not.toContain('version:'); // AgentSkills.io format doesn't have version
      expect(content).not.toContain('type:'); // AgentSkills.io format doesn't have type
      expect(content).toContain('# Database Helper');

      // Verify resource files are written
      const schemaFile = path.join(skillDir, 'schema.sql');
      const schemaContent = await fs.readFile(schemaFile, 'utf-8');
      expect(schemaContent).toBe('CREATE TABLE users...');
    });
  });

  describe('AgentIgnore emission', () => {
    it('should emit AgentIgnore to .a16n/agent-ignore/ with patterns array', async () => {
      const models: AgentIgnore[] = [
        {
          id: createId(CustomizationType.AgentIgnore, 'cursorignore'),
          type: CustomizationType.AgentIgnore,
          version: CURRENT_IR_VERSION,
          patterns: ['node_modules/**', 'dist/**', '*.log'],
          content: 'Ignore patterns for agent',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      const expectedPath = path.join(tempDir, '.a16n', 'agent-ignore', 'cursorignore.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      // Verify frontmatter contains patterns array
      expect(content).toContain('patterns:');
      expect(content).toContain('node_modules/**');
      expect(content).toContain('dist/**');
      expect(content).toContain('*.log');
      expect(content).toContain('type: agent-ignore');
    });
  });

  describe('ManualPrompt emission', () => {
    it('should emit ManualPrompt to .a16n/manual-prompt/', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, 'code-review'),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          promptName: 'code-review',
          content: '# Code Review\n\nReview pull requests.',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);
      
      const expectedPath = path.join(tempDir, '.a16n', 'manual-prompt', 'code-review.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      
      expect(content).toContain('type: manual-prompt');
      expect(content).toContain('# Code Review');
    });

    it('should create subdirectories from relativeDir for namespace collision avoidance', async () => {
      const models: ManualPrompt[] = [
        {
          id: createId(CustomizationType.ManualPrompt, 'shared/company/pr'),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          promptName: 'shared/company/pr',
          content: 'Company PR template',
          metadata: {},
          relativeDir: 'shared/company', // Provides namespace
        },
        {
          id: createId(CustomizationType.ManualPrompt, 'shared/other/pr'),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          promptName: 'shared/other/pr',
          content: 'Other PR template',
          metadata: {},
          relativeDir: 'shared/other',
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(2);
      
      // Verify both files exist in different subdirectories (no collision)
      const companyPath = path.join(tempDir, '.a16n', 'manual-prompt', 'shared', 'company', 'pr.md');
      const otherPath = path.join(tempDir, '.a16n', 'manual-prompt', 'shared', 'other', 'pr.md');
      
      const companyContent = await fs.readFile(companyPath, 'utf-8');
      const otherContent = await fs.readFile(otherPath, 'utf-8');
      
      expect(companyContent).toContain('Company PR template');
      expect(companyContent).toContain('relativeDir: shared/company');
      
      expect(otherContent).toContain('Other PR template');
      expect(otherContent).toContain('relativeDir: shared/other');
    });
  });

  describe('directory structure', () => {
    it('should use kebab-case directory names matching CustomizationType enum', async () => {
      const models: AgentCustomization[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test1'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Global prompt',
          metadata: {},
        },
        {
          id: createId(CustomizationType.FileRule, 'test2'),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          globs: ['*.ts'],
          content: 'File rule',
          metadata: {},
        },
        {
          id: createId(CustomizationType.SimpleAgentSkill, 'test3'),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          name: 'test3',
          description: 'Simple skill',
          content: 'Simple agent skill',
          metadata: {},
        },
      ];

      await a16nPlugin.emit(models, tempDir);

      // Verify kebab-case directories exist
      const globalPromptDir = path.join(tempDir, '.a16n', 'global-prompt');
      const fileRuleDir = path.join(tempDir, '.a16n', 'file-rule');
      const simpleSkillDir = path.join(tempDir, '.a16n', 'simple-agent-skill');
      
      const globalStat = await fs.stat(globalPromptDir);
      const fileStat = await fs.stat(fileRuleDir);
      const skillStat = await fs.stat(simpleSkillDir);
      
      expect(globalStat.isDirectory()).toBe(true);
      expect(fileStat.isDirectory()).toBe(true);
      expect(skillStat.isDirectory()).toBe(true);
    });

    it('should create parent directories if they do not exist', async () => {
      // Start with empty temp dir
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test content',
          metadata: {},
        },
      ];

      await a16nPlugin.emit(models, tempDir);

      // Verify .a16n/ directory was created
      const a16nDir = path.join(tempDir, '.a16n');
      const stat = await fs.stat(a16nDir);
      expect(stat.isDirectory()).toBe(true);
    });
  });

  describe('frontmatter exclusions', () => {
    it('should NOT include metadata in IR frontmatter', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test',
          metadata: { tool: 'cursor', custom: 'value' },
        },
      ];

      await a16nPlugin.emit(models, tempDir);

      const filePath = path.join(tempDir, '.a16n', 'global-prompt', 'test.md');
      const content = await fs.readFile(filePath, 'utf-8');
      
      expect(content).not.toContain('metadata:');
      expect(content).not.toContain('tool:');
      expect(content).not.toContain('cursor');
      expect(content).not.toContain('custom:');
    });

    it('should NOT include sourcePath in IR frontmatter', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: '.cursor/rules/original.mdc',
          content: 'Test',
          metadata: {},
        },
      ];

      await a16nPlugin.emit(models, tempDir);

      const filePath = path.join(tempDir, '.a16n', 'global-prompt', 'test.md');
      const content = await fs.readFile(filePath, 'utf-8');
      
      expect(content).not.toContain('sourcePath:');
      expect(content).not.toContain('.cursor/rules/original.mdc');
    });
  });

  describe('dry-run mode', () => {
    it('should return written files without actually writing in dry-run mode', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test content',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir, { dryRun: true });

      expect(result.written).toHaveLength(1);
      
      // Verify file was NOT actually written
      const filePath = path.join(tempDir, '.a16n', 'global-prompt', 'test.md');
      await expect(fs.access(filePath)).rejects.toThrow();
    });
  });

  describe('name slugification', () => {
    it('should slugify filenames from item IDs', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'My RULE Name!!!'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      expect(result.written).toHaveLength(1);

      // Verify filename is slugified
      const expectedPath = path.join(tempDir, '.a16n', 'global-prompt', 'my-rule-name.md');
      const content = await fs.readFile(expectedPath, 'utf-8');
      expect(content).toContain('Test');
    });
  });

  describe('malformed ID handling', () => {
    it('should produce warning for malformed ID with empty name after type prefix', async () => {
      const models: GlobalPrompt[] = [
        {
          // Malformed ID: just type prefix with no name, resulting in empty name after stripping extension
          id: 'global-prompt:.md',
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      // Should have warning for the malformed ID
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Invalid ID');
      expect(result.warnings[0].message).toContain('cannot extract a usable name');

      // Should not have written any files
      expect(result.written).toHaveLength(0);
    });

    it('should produce warning for ID with just type and colon', async () => {
      const models: GlobalPrompt[] = [
        {
          // ID with just type: prefix and nothing else
          id: 'global-prompt:',
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      // Should have warning for the malformed ID
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('Invalid ID');

      // Should not have written any files
      expect(result.written).toHaveLength(0);
    });
  });

  describe('EmitResult structure', () => {
    it('should return EmitResult with written files, warnings, and unsupported', async () => {
      const models: GlobalPrompt[] = [
        {
          id: createId(CustomizationType.GlobalPrompt, 'test'),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          content: 'Test',
          metadata: {},
        },
      ];

      const result = await a16nPlugin.emit(models, tempDir);

      // Verify EmitResult structure
      expect(result).toHaveProperty('written');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('unsupported');
      
      expect(Array.isArray(result.written)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.unsupported)).toBe(true);
      
      expect(result.written).toHaveLength(1);
      expect(result.written[0]).toHaveProperty('path');
      expect(result.written[0]).toHaveProperty('sourceItems');
    });
  });
});
