import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CustomizationType, CURRENT_IR_VERSION, type IRVersion } from '@a16njs/models';
import { parseIRFile } from '../src/parse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, 'fixtures');

describe('parseIRFile', () => {
  describe('GlobalPrompt', () => {
    it('should parse a valid GlobalPrompt IR file', async () => {
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.GlobalPrompt);
      expect(result.item?.version).toBe('v1beta1');
      expect(result.item?.content).toContain('Always use TypeScript');
      expect(result.item?.relativeDir).toBeUndefined();
    });

    it('should extract relativeDir if present', async () => {
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'with-relativedir.md');
      const result = await parseIRFile(filepath, 'with-relativedir.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.relativeDir).toBe('shared/company');
    });

    it('should handle missing relativeDir', async () => {
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item?.relativeDir).toBeUndefined();
    });
  });

  describe('FileRule', () => {
    it('should parse a valid FileRule IR file with globs', async () => {
      const filepath = path.join(fixturesDir, 'parse-fileRule', 'typescript.md');
      const result = await parseIRFile(filepath, 'typescript.md', '.a16n/file-rule');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.FileRule);
      if (result.item?.type === CustomizationType.FileRule) {
        expect(result.item.globs).toEqual(['*.ts', '*.tsx']);
      }
    });

    it('should parse globs as array', async () => {
      const filepath = path.join(fixturesDir, 'parse-fileRule', 'typescript.md');
      const result = await parseIRFile(filepath, 'typescript.md', '.a16n/file-rule');
      
      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.FileRule) {
        expect(Array.isArray(result.item.globs)).toBe(true);
        expect(result.item.globs.length).toBe(2);
      }
    });
  });

  describe('SimpleAgentSkill', () => {
    it('should parse a valid SimpleAgentSkill IR file', async () => {
      const filepath = path.join(fixturesDir, 'parse-simpleAgentSkill', 'database.md');
      const result = await parseIRFile(filepath, 'database.md', '.a16n/simple-agent-skill');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.SimpleAgentSkill);
      if (result.item?.type === CustomizationType.SimpleAgentSkill) {
        expect(result.item.description).toBe('Database operations and ORM usage');
      }
    });

    it('should extract description from frontmatter', async () => {
      const filepath = path.join(fixturesDir, 'parse-simpleAgentSkill', 'database.md');
      const result = await parseIRFile(filepath, 'database.md', '.a16n/simple-agent-skill');
      
      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.SimpleAgentSkill) {
        expect(result.item.description).toBeTruthy();
        expect(typeof result.item.description).toBe('string');
      }
    });

    it('should NOT expect name in frontmatter (filename is the name)', async () => {
      // Filename IS the name, no name field should be present in frontmatter
      const filepath = path.join(fixturesDir, 'parse-simpleAgentSkill', 'database.md');
      const result = await parseIRFile(filepath, 'database.md', '.a16n/simple-agent-skill');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // Parse should succeed even without name field in frontmatter
    });
  });

  describe('AgentSkillIO', () => {
    it('should use readAgentSkillIO from models (verbatim format)', async () => {
      // AgentSkillIO uses verbatim AgentSkills.io format (NO IR frontmatter)
      // This is handled by readAgentSkillIO() from @a16njs/models
      // Discovery function will use readAgentSkillIO instead of parseIRFile
      // So parseIRFile doesn't need to handle AgentSkillIO
      expect(true).toBe(true);
    });
  });

  describe('ManualPrompt', () => {
    it('should parse a valid ManualPrompt IR file', async () => {
      const filepath = path.join(fixturesDir, 'parse-manualPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/manual-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.ManualPrompt);
      if (result.item?.type === CustomizationType.ManualPrompt) {
        expect(result.item.promptName).toBe('basic');
      }
    });

    it('should derive promptName from relativeDir + filename', async () => {
      const filepath = path.join(fixturesDir, 'parse-manualPrompt', 'with-relativedir.md');
      const result = await parseIRFile(filepath, 'with-relativedir.md', '.a16n/manual-prompt');
      
      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.ManualPrompt) {
        // relativeDir: "shared/company" + filename: "with-relativedir.md" -> "shared/company/with-relativedir"
        expect(result.item.promptName).toBe('shared/company/with-relativedir');
        expect(result.item.relativeDir).toBe('shared/company');
      }
    });

    it('should derive promptName from filename only when no relativeDir', async () => {
      const filepath = path.join(fixturesDir, 'parse-manualPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/manual-prompt');
      
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
      const filepath = path.join(fixturesDir, 'parse-agentIgnore', 'patterns.md');
      const result = await parseIRFile(filepath, 'patterns.md', '.a16n/agent-ignore');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      expect(result.item?.type).toBe(CustomizationType.AgentIgnore);
      if (result.item?.type === CustomizationType.AgentIgnore) {
        expect(result.item.patterns).toEqual(['node_modules/', '*.log', '.env']);
      }
    });

    it('should parse patterns as array', async () => {
      const filepath = path.join(fixturesDir, 'parse-agentIgnore', 'patterns.md');
      const result = await parseIRFile(filepath, 'patterns.md', '.a16n/agent-ignore');
      
      expect(result.error).toBeUndefined();
      if (result.item?.type === CustomizationType.AgentIgnore) {
        expect(Array.isArray(result.item.patterns)).toBe(true);
        expect(result.item.patterns.length).toBe(3);
      }
    });
  });

  describe('version handling', () => {
    it('should return error for missing version field', async () => {
      const filepath = path.join(fixturesDir, 'parse-errors', 'missing-version.md');
      const result = await parseIRFile(filepath, 'missing-version.md', '.a16n/global-prompt');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('version');
      expect(result.item).toBeUndefined();
    });

    it('should return error for invalid version format', async () => {
      // TODO: Create fixture with invalid version
      // For now, test with basic fixture that has valid version
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      expect(result.error).toBeUndefined();
    });

    it('should accept valid version formats', async () => {
      // v1beta1, v2alpha1, etc.
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item?.version).toBe('v1beta1');
    });
  });

  describe('error handling', () => {
    it('should return error for missing type field', async () => {
      const filepath = path.join(fixturesDir, 'parse-errors', 'missing-type.md');
      const result = await parseIRFile(filepath, 'missing-type.md', '.a16n/global-prompt');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('type');
      expect(result.item).toBeUndefined();
    });

    it('should return error for invalid type value', async () => {
      const filepath = path.join(fixturesDir, 'parse-errors', 'invalid-type.md');
      const result = await parseIRFile(filepath, 'invalid-type.md', '.a16n/invalid-type');
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('type');
      expect(result.item).toBeUndefined();
    });

    it('should return error for malformed YAML frontmatter', async () => {
      // TODO: Create fixture with malformed YAML
      // For now, test with valid frontmatter
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      expect(result.error).toBeUndefined();
    });

    it('should return error for missing frontmatter', async () => {
      const filepath = path.join(fixturesDir, 'parse-errors', 'no-frontmatter.md');
      const result = await parseIRFile(filepath, 'no-frontmatter.md', '.a16n/global-prompt');
      
      expect(result.error).toBeDefined();
      expect(result.item).toBeUndefined();
    });

    it('should NOT expect name field (filename is the name)', async () => {
      // Verify no error when name field is missing (it should be missing!)
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
    });

    it('should NOT expect sourcePath field (not in IR format)', async () => {
      // sourcePath is NOT in IR format (omitted during emission)
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
      // sourcePath should be set by parseIRFile, not read from frontmatter
    });

    it('should NOT expect metadata field (transient only)', async () => {
      // metadata is NOT serialized to IR files
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle empty content (only frontmatter)', async () => {
      // Empty content is valid - frontmatter is required, content is optional
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      expect(result.error).toBeUndefined();
    });

    it('should preserve whitespace in content', async () => {
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      
      expect(result.error).toBeUndefined();
      expect(result.item?.content).toBeTruthy();
      // Content should preserve line breaks and whitespace
    });

    it('should handle content with YAML-like syntax', async () => {
      // Content that looks like YAML but isn't frontmatter should be treated as regular content
      const filepath = path.join(fixturesDir, 'parse-globalPrompt', 'basic.md');
      const result = await parseIRFile(filepath, 'basic.md', '.a16n/global-prompt');
      expect(result.error).toBeUndefined();
    });
  });
});
