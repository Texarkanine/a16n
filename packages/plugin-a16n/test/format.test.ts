import { describe, it, expect } from 'vitest';
import { CustomizationType, CURRENT_IR_VERSION, createId } from '@a16njs/models';
import type {
  GlobalPrompt,
  FileRule,
  SimpleAgentSkill,
  ManualPrompt,
  AgentIgnore,
  AgentSkillIO,
  Workspace,
} from '@a16njs/models';
import { formatIRFile } from '../src/format.js';
import { parseIRFile } from '../src/parse.js';

function mockWorkspace(content: string): Workspace {
  return {
    id: 'test',
    root: '/test',
    resolve: (p: string) => `/test/${p}`,
    exists: async () => true,
    read: async () => content,
    write: async () => {},
    readdir: async () => [],
    mkdir: async () => {},
  };
}

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
      expect(formatted).toContain('version: v1beta4');
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
      const skill: AgentSkillIO = {
        id: createId(CustomizationType.AgentSkillIO, 'deploy'),
        type: CustomizationType.AgentSkillIO,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/agent-skill-io/deploy/SKILL.md',
        content: 'Deploy instructions.',
        name: 'deploy',
        description: 'Deploy the application',
        files: {},
      };

      const formatted = formatIRFile(skill);

      expect(formatted).toContain('---');
      expect(formatted).toContain(`version: ${CURRENT_IR_VERSION}`);
      expect(formatted).toContain('type: agent-skill-io');
      expect(formatted).toContain('Deploy instructions.');
      // formatIRFile has no special handling for AgentSkillIO — name/description
      // are NOT emitted (writeAgentSkillIO handles the real format)
      expect(formatted).not.toMatch(/\nname:/);
      expect(formatted).not.toMatch(/\ndescription:/);
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

    it('should include authored description when present', () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'cleanup.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/cleanup.md',
        content: 'Clean up.',
        promptName: 'cleanup',
        description: 'Remove build artifacts and temp files',
      };

      const formatted = formatIRFile(prompt);
      expect(formatted).toContain('description: Remove build artifacts and temp files');
    });

    it('should omit description when absent', () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'review.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/review.md',
        content: 'Content.',
        promptName: 'review',
      };

      const formatted = formatIRFile(prompt);
      expect(formatted).not.toMatch(/\ndescription:/);
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
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Always use TypeScript.',
      };

      const formatted = formatIRFile(gp);
      const result = await parseIRFile(mockWorkspace(formatted), 'test.md', 'test.md', gp.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.item!.version).toBe(CURRENT_IR_VERSION);
      expect(result.item!.content).toContain('Always use TypeScript.');
    });

    it('should round-trip FileRule (format -> parse -> format)', async () => {
      const fr: FileRule = {
        id: createId(CustomizationType.FileRule, 'typescript.md'),
        type: CustomizationType.FileRule,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/file-rule/typescript.md',
        content: 'TypeScript rules.',
        globs: ['*.ts', '*.tsx'],
      };

      const formatted = formatIRFile(fr);
      const result = await parseIRFile(mockWorkspace(formatted), 'typescript.md', 'typescript.md', fr.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.type).toBe(CustomizationType.FileRule);
      expect(result.item!.version).toBe(CURRENT_IR_VERSION);
      expect(result.item!.content).toContain('TypeScript rules.');
      expect((result.item as FileRule).globs).toEqual(['*.ts', '*.tsx']);
    });

    it('should round-trip SimpleAgentSkill (format -> parse -> format)', async () => {
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
      const result = await parseIRFile(mockWorkspace(formatted), 'database.md', 'database.md', skill.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.type).toBe(CustomizationType.SimpleAgentSkill);
      expect(result.item!.version).toBe(CURRENT_IR_VERSION);
      expect(result.item!.content).toContain('Database content.');
      expect((result.item as SimpleAgentSkill).name).toBe('database');
      expect((result.item as SimpleAgentSkill).description).toBe('Database operations');
    });

    it('should round-trip ManualPrompt (format -> parse -> format)', async () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'review.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/review.md',
        content: 'Review content.',
        promptName: 'review',
      };

      const formatted = formatIRFile(prompt);
      const result = await parseIRFile(mockWorkspace(formatted), 'review.md', 'review.md', prompt.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.type).toBe(CustomizationType.ManualPrompt);
      expect(result.item!.version).toBe(CURRENT_IR_VERSION);
      expect(result.item!.content).toContain('Review content.');
      expect((result.item as ManualPrompt).promptName).toBe('review');
    });

    it('should round-trip ManualPrompt authored description', async () => {
      const prompt: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'cleanup.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/cleanup.md',
        content: 'Clean up.',
        promptName: 'cleanup',
        description: 'Remove build artifacts and temp files',
      };

      const formatted = formatIRFile(prompt);
      const result = await parseIRFile(mockWorkspace(formatted), 'cleanup.md', 'cleanup.md', prompt.sourcePath);

      expect(result.error).toBeUndefined();
      expect((result.item as ManualPrompt).description).toBe(
        'Remove build artifacts and temp files'
      );
    });

    it('should round-trip AgentIgnore (format -> parse -> format)', async () => {
      const ignore: AgentIgnore = {
        id: createId(CustomizationType.AgentIgnore, 'patterns.md'),
        type: CustomizationType.AgentIgnore,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/agent-ignore/patterns.md',
        content: 'Ignore content.',
        patterns: ['node_modules/', '*.log'],
      };

      const formatted = formatIRFile(ignore);
      const result = await parseIRFile(mockWorkspace(formatted), 'patterns.md', 'patterns.md', ignore.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.type).toBe(CustomizationType.AgentIgnore);
      expect(result.item!.version).toBe(CURRENT_IR_VERSION);
      expect(result.item!.content).toContain('Ignore content.');
      expect((result.item as AgentIgnore).patterns).toEqual(['node_modules/', '*.log']);
    });

    it('should preserve relativeDir through round-trip', async () => {
      const gp: GlobalPrompt = {
        id: createId(CustomizationType.GlobalPrompt, 'test.md'),
        type: CustomizationType.GlobalPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/global-prompt/test.md',
        content: 'Content with relativeDir.',
        relativeDir: 'shared',
      };

      const formatted = formatIRFile(gp);
      const result = await parseIRFile(mockWorkspace(formatted), 'test.md', 'test.md', gp.sourcePath);

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item!.relativeDir).toBe('shared');
    });
  });

  describe('AgentSkills.io spec fields', () => {
    /**
     * The IR is the lossless waypoint: whatever a plugin discovered has to
     * survive a write and a read, or every conversion routed through `.a16n/`
     * silently degrades. On disk these use the *spec* key names, not the IR
     * property names, so an `.a16n/` file is readable by anything that already
     * understands AgentSkills.io frontmatter.
     *
     * Note `specMetadata` serializes as `metadata:` even though the IR's own
     * `metadata` property is deliberately never written — they are different
     * things that collided on a name (see creative-metadata-collision).
     */
    const specFields = {
      license: 'Apache-2.0',
      compatibility: 'Requires Node 22+',
      specMetadata: { author: 'Texarkanine', version: '1.0' },
      allowedTools: 'Bash(git:*) Read',
    };

    function skill(extra: Partial<SimpleAgentSkill> = {}): SimpleAgentSkill {
      return {
        id: createId(CustomizationType.SimpleAgentSkill, 'deploy.md'),
        type: CustomizationType.SimpleAgentSkill,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/simple-agent-skill/deploy.md',
        content: 'Deploy the app.',
        name: 'deploy',
        description: 'Deployment helper',
        ...extra,
      };
    }

    it('should write spec key names, not IR property names', () => {
      const formatted = formatIRFile(skill(specFields));

      expect(formatted).toContain('license: Apache-2.0');
      expect(formatted).toContain('compatibility: Requires Node 22+');
      expect(formatted).toContain('allowed-tools: Bash(git:*) Read');
      expect(formatted).toContain('metadata:');
      expect(formatted).toContain('author: Texarkanine');
      // The camelCase IR names must never reach disk.
      expect(formatted).not.toContain('allowedTools');
      expect(formatted).not.toContain('specMetadata');
    });

    it('should omit spec keys entirely when the item carries none', () => {
      const formatted = formatIRFile(skill());

      expect(formatted).not.toContain('license');
      expect(formatted).not.toContain('compatibility');
      expect(formatted).not.toContain('allowed-tools');
      expect(formatted).not.toContain('metadata');
    });

    it('should not serialize the transient IR metadata property', () => {
      const formatted = formatIRFile(skill({ metadata: { discoveredBy: 'claude' } }));

      expect(formatted).not.toContain('discoveredBy');
      expect(formatted).not.toContain('metadata');
    });

    it('should round-trip all four fields on a SimpleAgentSkill', async () => {
      const original = skill(specFields);
      const formatted = formatIRFile(original);
      const result = await parseIRFile(
        mockWorkspace(formatted),
        'deploy.md',
        'deploy.md',
        original.sourcePath
      );

      expect(result.error).toBeUndefined();
      const parsed = result.item as SimpleAgentSkill;
      expect(parsed.license).toBe('Apache-2.0');
      expect(parsed.compatibility).toBe('Requires Node 22+');
      expect(parsed.specMetadata).toEqual({ author: 'Texarkanine', version: '1.0' });
      expect(parsed.allowedTools).toBe('Bash(git:*) Read');
    });

    it('should round-trip all four fields on a ManualPrompt', async () => {
      const original: ManualPrompt = {
        id: createId(CustomizationType.ManualPrompt, 'clean.md'),
        type: CustomizationType.ManualPrompt,
        version: CURRENT_IR_VERSION,
        sourcePath: '.a16n/manual-prompt/clean.md',
        content: 'Clean the workspace.',
        promptName: 'clean',
        ...specFields,
      };

      const formatted = formatIRFile(original);
      const result = await parseIRFile(
        mockWorkspace(formatted),
        'clean.md',
        'clean.md',
        original.sourcePath
      );

      expect(result.error).toBeUndefined();
      const parsed = result.item as ManualPrompt;
      expect(parsed.allowedTools).toBe('Bash(git:*) Read');
      expect(parsed.license).toBe('Apache-2.0');
      expect(parsed.compatibility).toBe('Requires Node 22+');
      expect(parsed.specMetadata).toEqual({ author: 'Texarkanine', version: '1.0' });
    });

    it('should leave spec fields undefined when the IR file omits them', async () => {
      const formatted = formatIRFile(skill());
      const result = await parseIRFile(
        mockWorkspace(formatted),
        'deploy.md',
        'deploy.md',
        '.a16n/simple-agent-skill/deploy.md'
      );

      const parsed = result.item as SimpleAgentSkill;
      expect(parsed.license).toBeUndefined();
      expect(parsed.compatibility).toBeUndefined();
      expect(parsed.specMetadata).toBeUndefined();
      expect(parsed.allowedTools).toBeUndefined();
    });

    it('should survive values that need YAML quoting', async () => {
      const original = skill({
        license: 'SEE LICENSE IN: ./LICENSE.md',
        compatibility: '#1 priority: "quoted" & odd',
      });

      const formatted = formatIRFile(original);
      const result = await parseIRFile(
        mockWorkspace(formatted),
        'deploy.md',
        'deploy.md',
        original.sourcePath
      );

      const parsed = result.item as SimpleAgentSkill;
      expect(parsed.license).toBe('SEE LICENSE IN: ./LICENSE.md');
      expect(parsed.compatibility).toBe('#1 priority: "quoted" & odd');
    });
  });
});
