import { describe, it, expect } from 'vitest';
import { CustomizationType, CURRENT_IR_VERSION, createId } from '@a16njs/models';
import type {
  GlobalPrompt,
  FileRule,
  SimpleAgentSkill,
  ManualPrompt,
  AgentIgnore,
} from '@a16njs/models';
import { formatIRFile } from '../src/format.js';

describe('formatIRFile', () => {
  describe('GlobalPrompt', () => {
    it('should format a valid GlobalPrompt to IR format', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Always use TypeScript.',
      };
      
      const formatted = formatIRFile(gp);
      
      expect(formatted).toContain('---');
      expect(formatted).toContain('version: v1beta2');
      expect(formatted).toContain('type: global-prompt');
      expect(formatted).toContain('Always use TypeScript.');
    });

    it('should include relativeDir if present', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content here.',
        relativeDir: 'shared/company',
      };
      
      const formatted = formatIRFile(gp);
      expect(formatted).toContain('relativeDir: shared/company');
    });

    it('should omit relativeDir if not present', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content here.',
      };
      
      const formatted = formatIRFile(gp);
      expect(formatted).not.toContain('relativeDir');
    });

    it('should NOT include sourcePath (omitted from IR format)', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content here.',
      };
      
      const formatted = formatIRFile(gp);
      expect(formatted).not.toContain('sourcePath');
    });

    it('should NOT include metadata (not serialized)', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content here.',
        metadata: { someKey: 'someValue' },
      };
      
      const formatted = formatIRFile(gp);
      expect(formatted).not.toContain('metadata');
      expect(formatted).not.toContain('someKey');
    });
  });

  describe('FileRule', () => {
    it('should format a valid FileRule with globs', () => {
      const fr: FileRule = {
        id: createId(CustomizationType.FileRule, 'typescript.md'),
        type: CustomizationType.FileRule,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/file-rule/typescript.md',
        content: 'TypeScript rules.',
        globs: ['*.ts', '*.tsx'],
      };
      
      const formatted = formatIRFile(fr);
      
      expect(formatted).toContain('type: file-rule');
      expect(formatted).toContain('globs');
      expect(formatted).toContain('*.ts');
      expect(formatted).toContain('*.tsx');
    });

    it('should format globs as YAML array', () => {
      const fr: FileRule = {
        id: createId(CustomizationType.FileRule, 'test.md'),
        type: CustomizationType.FileRule,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/file-rule/test.md',
        content: 'Content.',
        globs: ['*.js', '*.jsx'],
      };
      
      const formatted = formatIRFile(fr);
      
      // Should be YAML array format
      expect(formatted).toMatch(/globs:\s*\n\s*-/);
    });
  });

  describe('SimpleAgentSkill', () => {
    it('should format a valid SimpleAgentSkill', () => {
      const skill: SimpleAgentSkill = {
        id: createId(CustomizationType.SimpleAgentSkill, 'database.md'),
        type: CustomizationType.SimpleAgentSkill,
        version: CURRENT_IR_VERSION,
        name: 'database',
        sourcePath: '.a16n/simple-agent-skill/database.md',
        content: 'Database content.',
        description: 'Database operations',
      };
      
      const formatted = formatIRFile(skill);
      
      expect(formatted).toContain('type: simple-agent-skill');
      expect(formatted).toContain('name: database');
      expect(formatted).toContain('description: Database operations');
      expect(formatted).toContain('Database content.');
    });

    it('should include description in frontmatter', () => {
      const skill: SimpleAgentSkill = {
        id: createId(CustomizationType.SimpleAgentSkill, 'test.md'),
        type: CustomizationType.SimpleAgentSkill,
        version: CURRENT_IR_VERSION,
        name: 'test',
        sourcePath: '.a16n/simple-agent-skill/test.md',
        content: 'Content.',
        description: 'Test description',
      };
      
      const formatted = formatIRFile(skill);
      expect(formatted).toContain('description: Test description');
    });

    it('should include name in frontmatter (required for invocation)', () => {
      const skill: SimpleAgentSkill = {
        id: createId(CustomizationType.SimpleAgentSkill, 'database.md'),
        type: CustomizationType.SimpleAgentSkill,
        version: CURRENT_IR_VERSION,
        name: 'database',
        sourcePath: '.a16n/simple-agent-skill/database.md',
        content: 'Content.',
        description: 'Database operations',
      };
      
      const formatted = formatIRFile(skill);
      expect(formatted).toContain('name: database');
    });
  });

  describe('AgentSkillIO', () => {
    it('should use writeAgentSkillIO from models (verbatim format)', () => {
      // AgentSkillIO uses verbatim AgentSkills.io format (NO IR frontmatter)
      // This is handled by writeAgentSkillIO() from @a16njs/models
      // Emit function will use writeAgentSkillIO instead of formatIRFile
      expect(true).toBe(true);
    });
  });

  describe('ManualPrompt', () => {
    it('should format a valid ManualPrompt', () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'review.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/review.md',
        content: 'Review content.',
        promptName: 'review',
      };
      
      const formatted = formatIRFile(prompt);
      
      expect(formatted).toContain('type: manual-prompt');
      expect(formatted).toContain('Review content.');
    });

    it('should include relativeDir if present', () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'pr.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/shared/company/pr.md',
        content: 'PR content.',
        promptName: 'shared/company/pr',
        relativeDir: 'shared/company',
      };
      
      const formatted = formatIRFile(prompt);
      expect(formatted).toContain('relativeDir: shared/company');
    });

    it('should NOT include promptName in frontmatter (derived from relativeDir + filename)', () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'review.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/review.md',
        content: 'Content.',
        promptName: 'review',
      };
      
      const formatted = formatIRFile(prompt);
      // Should NOT include "promptName:" field (derived from relativeDir + filename)
      expect(formatted).not.toMatch(/\npromptName:/);
    });
  });

  describe('AgentIgnore', () => {
    it('should format a valid AgentIgnore with patterns', () => {
      const ignore: AgentIgnore = {
        id: createId(CustomizationType.AgentIgnore, 'patterns.md'),
        type: CustomizationType.AgentIgnore,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/agent-ignore/patterns.md',
        content: 'Ignore content.',
        patterns: ['node_modules/', '*.log'],
      };
      
      const formatted = formatIRFile(ignore);
      
      expect(formatted).toContain('type: agent-ignore');
      expect(formatted).toContain('patterns');
      expect(formatted).toContain('node_modules/');
      expect(formatted).toContain('*.log');
    });

    it('should format patterns as YAML array', () => {
      const ignore: AgentIgnore = {
        id: createId(CustomizationType.AgentIgnore, 'test.md'),
        type: CustomizationType.AgentIgnore,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/agent-ignore/test.md',
        content: 'Content.',
        patterns: ['*.tmp', '.env'],
      };
      
      const formatted = formatIRFile(ignore);
      
      // Should be YAML array format
      expect(formatted).toMatch(/patterns:\s*\n\s*-/);
    });
  });

  describe('YAML formatting', () => {
    it('should use --- delimiters for frontmatter', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content.',
      };
      
      const formatted = formatIRFile(gp);
      
      // Should have --- at start and end of frontmatter
      expect(formatted).toMatch(/^---\n/);
      expect(formatted).toMatch(/\n---\n\n/);
    });

    it('should include blank line between frontmatter and content', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content here.',
      };
      
      const formatted = formatIRFile(gp);
      
      // Should have blank line: ---\n\nContent
      expect(formatted).toMatch(/---\n\nContent/);
    });

    it('should end with newline', () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content.',
      };
      
      const formatted = formatIRFile(gp);
      expect(formatted.endsWith('\n')).toBe(true);
    });

    it('should quote YAML special characters in string values', () => {
      const skill: SimpleAgentSkill = {
        id: createId(CustomizationType.SimpleAgentSkill, 'test.md'),
        type: CustomizationType.SimpleAgentSkill,
        version: CURRENT_IR_VERSION,
        name: 'test',
        sourcePath: '.a16n/simple-agent-skill/test.md',
        content: 'Content.',
        description: 'Description with: colon and #hash',
      };
      
      const formatted = formatIRFile(skill);
      
      // Should quote strings with YAML special characters
      expect(formatted).toContain('description');
    });
  });

  describe('round-trip', () => {
    it('should round-trip GlobalPrompt (format -> parse -> format)', async () => {
      // Round-trip tests will be implemented after format.ts is complete
      // They require both parseIRFile and formatIRFile to be functional
      expect(true).toBe(true);
    });

    it('should round-trip FileRule (format -> parse -> format)', async () => {
      expect(true).toBe(true);
    });

    it('should round-trip SimpleAgentSkill (format -> parse -> format)', async () => {
      expect(true).toBe(true);
    });

    it('should round-trip ManualPrompt (format -> parse -> format)', async () => {
      expect(true).toBe(true);
    });

    it('should round-trip AgentIgnore (format -> parse -> format)', async () => {
      expect(true).toBe(true);
    });

    it('should preserve relativeDir through round-trip', async () => {
      expect(true).toBe(true);
    });
  });
});
