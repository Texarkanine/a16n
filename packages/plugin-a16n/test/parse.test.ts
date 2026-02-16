import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CustomizationType, CURRENT_IR_VERSION, LocalWorkspace, type IRVersion } from '@a16njs/models';
import { parseIRFile } from '../src/parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');
const ws = new LocalWorkspace('test-parse', fixturesDir);

describe('parseIRFile', () => {
  describe('GlobalPrompt', () => {
    it('should parse a valid GlobalPrompt IR file', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.item?.version).toBe('v1beta1');
      expect(result.item?.content).toContain('Always use TypeScript');
      expect(result.item?.relativeDir).toBeUndefined();
    });

    it('should extract relativeDir if present', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/with-relativedir.md', 'with-relativedir.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.relativeDir).toBe('shared/company');
    });

    it('should handle missing relativeDir', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item?.relativeDir).toBeUndefined();
    });
  });

  describe('FileRule', () => {
    it('should parse a valid FileRule IR file with globs', async () => {
      const result = await parseIRFile(ws, 'parse-fileRule/typescript.md', 'typescript.md', '.a16n/file-rule');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.FileRule);
      if (result.item?.type === CustomizationType.FileRule) {
        expect(result.item.globs).toEqual(['*.ts', '*.tsx']);
      }
    });

    it('should parse globs as array', async () => {
      const result = await parseIRFile(ws, 'parse-fileRule/typescript.md', 'typescript.md', '.a16n/file-rule');

      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.FileRule) {
        expect(Array.isArray(result.item.globs)).toBe(true);
        expect(result.item.globs.length).toBe(2);
      }
    });
  });

  describe('SimpleAgentSkill', () => {
    it('should parse a valid SimpleAgentSkill IR file', async () => {
      const result = await parseIRFile(ws, 'parse-simpleAgentSkill/database.md', 'database.md', '.a16n/simple-agent-skill');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.SimpleAgentSkill);
      if (result.item?.type === CustomizationType.SimpleAgentSkill) {
        expect(result.item.description).toBe('Database operations and ORM usage');
      }
    });

    it('should extract description from frontmatter', async () => {
      const result = await parseIRFile(ws, 'parse-simpleAgentSkill/database.md', 'database.md', '.a16n/simple-agent-skill');

      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.SimpleAgentSkill) {
        expect(result.item.description).toBeTruthy();
        expect(typeof result.item.description).toBe('string');
      }
    });

    it('should NOT expect name in frontmatter (filename is the name)', async () => {
      // Filename IS the name, no name field should be present in frontmatter
      const result = await parseIRFile(ws, 'parse-simpleAgentSkill/database.md', 'database.md', '.a16n/simple-agent-skill');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // Parse should succeed even without name field in frontmatter
    });
  });

  // AgentSkillIO: Not tested here because parseIRFile is not used for AgentSkillIO.
  // AgentSkillIO uses verbatim AgentSkills.io format (NO IR frontmatter) and is
  // handled by readAgentSkillIO() from @a16njs/models.

  describe('ManualPrompt', () => {
    it('should parse a valid ManualPrompt IR file', async () => {
      const result = await parseIRFile(ws, 'parse-manualPrompt/basic.md', 'basic.md', '.a16n/manual-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.ManualPrompt);
      if (result.item?.type === CustomizationType.ManualPrompt) {
        expect(result.item.promptName).toBe('basic');
      }
    });

    it('should derive promptName from relativeDir + filename', async () => {
      const result = await parseIRFile(ws, 'parse-manualPrompt/with-relativedir.md', 'with-relativedir.md', '.a16n/manual-prompt');

      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.ManualPrompt) {
        // relativeDir: "shared/company" + filename: "with-relativedir.md" -> "shared/company/with-relativedir"
        expect(result.item.promptName).toBe('shared/company/with-relativedir');
        expect(result.item.relativeDir).toBe('shared/company');
      }
    });

    it('should derive promptName from filename only when no relativeDir', async () => {
      const result = await parseIRFile(ws, 'parse-manualPrompt/basic.md', 'basic.md', '.a16n/manual-prompt');

      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.ManualPrompt) {
        // No relativeDir, so promptName is just filename without extension
        expect(result.item.promptName).toBe('basic');
        expect(result.item.relativeDir).toBeUndefined();
      }
    });
  });

  describe('AgentIgnore', () => {
    it('should parse a valid AgentIgnore IR file with patterns', async () => {
      const result = await parseIRFile(ws, 'parse-agentIgnore/patterns.md', 'patterns.md', '.a16n/agent-ignore');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.AgentIgnore);
      if (result.item?.type === CustomizationType.AgentIgnore) {
        expect(result.item.patterns).toEqual(['node_modules/', '*.log', '.env']);
      }
    });

    it('should parse patterns as array', async () => {
      const result = await parseIRFile(ws, 'parse-agentIgnore/patterns.md', 'patterns.md', '.a16n/agent-ignore');

      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.AgentIgnore) {
        expect(Array.isArray(result.item.patterns)).toBe(true);
        expect(result.item.patterns.length).toBe(3);
      }
    });
  });

  describe('version handling', () => {
    it('should return error for missing version field', async () => {
      const result = await parseIRFile(ws, 'parse-errors/missing-version.md', 'missing-version.md', '.a16n/global-prompt');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('version');
      expect(result.item).toBeUndefined();
    });

    it('should return error for invalid version format', async () => {
      const result = await parseIRFile(ws, 'parse-errors/invalid-version.md', 'invalid-version.md', '.a16n/global-prompt');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid version format');
      expect(result.item).toBeUndefined();
    });

    it('should accept valid version formats', async () => {
      // v1beta1, v2alpha1, etc.
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item?.version).toBe('v1beta1');
    });
  });

  describe('error handling', () => {
    it('should return error for missing type field', async () => {
      const result = await parseIRFile(ws, 'parse-errors/missing-type.md', 'missing-type.md', '.a16n/global-prompt');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('type');
      expect(result.item).toBeUndefined();
    });

    it('should return error for invalid type value', async () => {
      const result = await parseIRFile(ws, 'parse-errors/invalid-type.md', 'invalid-type.md', '.a16n/invalid-type');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('type');
      expect(result.item).toBeUndefined();
    });

    it('should return error for malformed YAML frontmatter', async () => {
      const result = await parseIRFile(ws, 'parse-errors/malformed-yaml.md', 'malformed-yaml.md', '.a16n/global-prompt');

      expect(result.error).toBeDefined();
      expect(result.error).toContain('YAML');
      expect(result.item).toBeUndefined();
    });

    it('should return error for missing frontmatter', async () => {
      const result = await parseIRFile(ws, 'parse-errors/no-frontmatter.md', 'no-frontmatter.md', '.a16n/global-prompt');

      expect(result.error).toBeDefined();
      expect(result.item).toBeUndefined();
    });

    it('should NOT expect name field (filename is the name)', async () => {
      // Verify no error when name field is missing (it should be missing!)
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
    });

    it('should NOT expect sourcePath field (not in IR format)', async () => {
      // sourcePath is NOT in IR format (omitted during emission)
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // sourcePath should be set by parseIRFile, not read from frontmatter
    });

    it('should NOT expect metadata field (transient only)', async () => {
      // metadata is NOT serialized to IR files
      const result = await parseIRFile(ws, 'parse-globalPrompt/basic.md', 'basic.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content (only frontmatter)', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/empty-content.md', 'empty-content.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // Empty content after frontmatter should result in empty string
      expect(result.item?.content).toBe('');
    });

    it('should preserve whitespace in content', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/with-whitespace.md', 'with-whitespace.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item?.content).toBeTruthy();
      // Content should preserve leading spaces, multiple blank lines, and trailing newline
      expect(result.item?.content).toContain('  Leading spaces');
      expect(result.item?.content).toContain('\n\n');
    });

    it('should handle content with YAML-like syntax', async () => {
      const result = await parseIRFile(ws, 'parse-globalPrompt/yaml-like-content.md', 'yaml-like-content.md', '.a16n/global-prompt');

      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // YAML-like content should be treated as content, not frontmatter
      expect(result.item?.content).toContain('config:');
      expect(result.item?.content).toContain('key: value');
      expect(result.item?.content).toContain('---');
    });
  });
});
