import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import {
  parseSkillFrontmatter,
  readSkillFiles,
  writeAgentSkillIO,
  readAgentSkillIO,
  extractSpecFields,
  formatSpecFieldsYaml,
  type ParsedSkillFrontmatter,
  type ParsedSkill,
} from '../src/agentskills-io.js';

/**
 * The inverse of `extractSpecFields`. Both live here so the four spec key
 * names are spelled exactly once in the codebase; every plugin that hand-rolls
 * frontmatter (Claude, Cursor) renders through this.
 */
describe('formatSpecFieldsYaml', () => {
  it('should return an empty string when no spec fields are present', () => {
    expect(formatSpecFieldsYaml({})).toBe('');
  });

  it('should render each field under its spec key name, JSON-quoted', () => {
    const out = formatSpecFieldsYaml({
      license: 'Apache-2.0',
      compatibility: 'Requires Node 22+',
      allowedTools: 'Bash(rm:*)',
    });

    expect(out).toContain('\nlicense: "Apache-2.0"');
    expect(out).toContain('\ncompatibility: "Requires Node 22+"');
    // Spec key is hyphenated on disk even though the IR field is camelCase.
    expect(out).toContain('\nallowed-tools: "Bash(rm:*)"');
  });

  it('should render specMetadata as a nested map under the spec metadata key', () => {
    const out = formatSpecFieldsYaml({ specMetadata: { author: 'Texarkanine', version: '1.0' } });

    expect(out).toBe('\nmetadata:\n  "author": "Texarkanine"\n  "version": "1.0"');
  });

  it('should omit an empty specMetadata rather than emit a dangling key', () => {
    expect(formatSpecFieldsYaml({ specMetadata: {} })).toBe('');
  });

  it('should round-trip through extractSpecFields', () => {
    const fields = {
      license: 'MIT',
      compatibility: 'Any: harness',
      specMetadata: { author: 'a "quoted" name' },
      allowedTools: 'Bash(git:*) Read',
    };

    const doc = `---\nname: "x"\ndescription: "y"${formatSpecFieldsYaml(fields)}\n---\n\nbody\n`;
    const parsed = parseSkillFrontmatter(doc);

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    const { frontmatter } = parsed.skill;
    expect(frontmatter.license).toBe('MIT');
    expect(frontmatter.compatibility).toBe('Any: harness');
    expect(frontmatter.specMetadata).toEqual({ author: 'a "quoted" name' });
    expect(frontmatter.allowedTools).toBe('Bash(git:*) Read');
  });
});

describe('parseSkillFrontmatter', () => {
  it('should parse valid AgentSkills.io frontmatter', () => {
    const content = `---
name: deploy
description: Deploy the application
resources:
  - checklist.md
  - config.json
---

Deploy instructions here.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.name).toBe('deploy');
      expect(result.skill.frontmatter.description).toBe('Deploy the application');
      expect(result.skill.frontmatter.resources).toEqual(['checklist.md', 'config.json']);
      expect(result.skill.content).toBe('Deploy instructions here.');
    }
  });

  it('should parse frontmatter with disableModelInvocation', () => {
    const content = `---
name: review
description: Review code
disable-model-invocation: true
---

Review instructions.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.disableModelInvocation).toBe(true);
    }
  });

  it('should parse frontmatter without resources', () => {
    const content = `---
name: simple
description: Simple skill
---

Simple content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.resources).toBeUndefined();
      expect(result.skill.content).toBe('Simple content.');
    }
  });

  it('should return error for missing required fields', () => {
    const missingName = `---
description: Test
---

Content.`;

    const result1 = parseSkillFrontmatter(missingName);
    expect(result1.success).toBe(false);
    if (!result1.success) {
      expect(result1.error).toContain('name');
    }

    const missingDescription = `---
name: test
---

Content.`;

    const result2 = parseSkillFrontmatter(missingDescription);
    expect(result2.success).toBe(false);
    if (!result2.success) {
      expect(result2.error).toContain('description');
    }
  });

  it('should return error for invalid YAML', () => {
    const invalid = `---
name: test
description: test
  invalid: indentation
---

Content.`;

    const result = parseSkillFrontmatter(invalid);
    expect(result.success).toBe(false);
  });

  it('should extract content after frontmatter', () => {
    const content = `---
name: test
description: Test skill
---

Line 1
Line 2

Line 3`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.content).toBe('Line 1\nLine 2\n\nLine 3');
    }
  });
});

describe('parseSkillFrontmatter — AgentSkills.io spec fields', () => {
  /**
   * The optional spec fields (`license`, `compatibility`, `metadata`,
   * `allowed-tools`) were historically discarded by this parser. They must now
   * be read, with `metadata` landing on `specMetadata` to avoid colliding with
   * the IR's unrelated transient `metadata`.
   */

  it('should parse all four spec fields', () => {
    const content = `---
name: deploy
description: Deploy the application
license: Apache-2.0
compatibility: Requires Python 3.14+ and uv
metadata:
  author: Texarkanine
  version: "1.2.0"
allowed-tools: Bash(git:*) Bash(jq:*) Read
---

Deploy instructions.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const fm = result.skill.frontmatter;
      expect(fm.license).toBe('Apache-2.0');
      expect(fm.compatibility).toBe('Requires Python 3.14+ and uv');
      expect(fm.specMetadata).toEqual({ author: 'Texarkanine', version: '1.2.0' });
      expect(fm.allowedTools).toBe('Bash(git:*) Bash(jq:*) Read');
    }
  });

  it('should leave all four undefined when absent', () => {
    const content = `---
name: plain
description: A plain skill
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const fm = result.skill.frontmatter;
      expect(fm.license).toBeUndefined();
      expect(fm.compatibility).toBeUndefined();
      expect(fm.specMetadata).toBeUndefined();
      expect(fm.allowedTools).toBeUndefined();
    }
  });

  it('should preserve allowed-tools as the exact authored string', () => {
    const content = `---
name: risky
description: Risky skill
allowed-tools: Bash(git:*)   Read Bash(jq:*)
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      // Neither split nor reordered nor whitespace-normalized.
      expect(result.skill.frontmatter.allowedTools).toBe('Bash(git:*)   Read Bash(jq:*)');
    }
  });

  it('should coerce non-string metadata values to strings', () => {
    const content = `---
name: coerce
description: Coercion test
metadata:
  version: 1.0
  stable: true
  count: 3
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.specMetadata).toEqual({
        version: '1',
        stable: 'true',
        count: '3',
      });
    }
  });

  it('should omit empty metadata rather than returning an empty map', () => {
    const content = `---
name: empty
description: Empty metadata
metadata: {}
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.specMetadata).toBeUndefined();
    }
  });

  it('should keep metadata keys that collide with reserved names nested', () => {
    const content = `---
name: collide
description: Real description
metadata:
  name: not-the-skill-name
  description: not-the-skill-description
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      const fm = result.skill.frontmatter;
      expect(fm.name).toBe('collide');
      expect(fm.description).toBe('Real description');
      expect(fm.specMetadata).toEqual({
        name: 'not-the-skill-name',
        description: 'not-the-skill-description',
      });
    }
  });

  it('should pass through a license containing punctuation', () => {
    const content = `---
name: proprietary
description: Proprietary skill
license: Proprietary. LICENSE.txt has complete terms
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.license).toBe(
        'Proprietary. LICENSE.txt has complete terms'
      );
    }
  });

  it('should pass through an over-long compatibility without truncating', () => {
    // a16n converts; it does not validate the spec's 500-character limit.
    const long = 'x'.repeat(900);
    const content = `---
name: long
description: Long compatibility
compatibility: ${long}
---

Content.`;

    const result = parseSkillFrontmatter(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.compatibility).toBe(long);
    }
  });
});

describe('readSkillFiles', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'agentskills-io-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should read resource files from skill directory', async () => {
    await fs.writeFile(path.join(testDir, 'checklist.md'), 'Checklist content');
    await fs.writeFile(path.join(testDir, 'config.json'), '{"key": "value"}');

    const files = await readSkillFiles(testDir, ['checklist.md', 'config.json']);
    expect(files).toEqual({
      'checklist.md': 'Checklist content',
      'config.json': '{"key": "value"}',
    });
  });

  it('should return empty object when no resources', async () => {
    const files = await readSkillFiles(testDir, []);
    expect(files).toEqual({});
  });

  it('should handle missing resource files gracefully', async () => {
    await fs.writeFile(path.join(testDir, 'exists.md'), 'Content');

    // Should skip missing files
    const files = await readSkillFiles(testDir, ['exists.md', 'missing.md']);
    expect(files).toEqual({
      'exists.md': 'Content',
    });
  });

  it('should prevent path traversal attacks', async () => {
    // Create a file outside the skill directory
    const outsideFile = path.join(testDir, '..', 'outside.txt');
    await fs.writeFile(outsideFile, 'Outside content');

    // Create legitimate file inside
    await fs.writeFile(path.join(testDir, 'inside.md'), 'Inside content');

    // Attempt to read with path traversal
    const files = await readSkillFiles(testDir, ['inside.md', '../outside.txt']);

    // Should only read the legitimate file
    expect(files).toEqual({
      'inside.md': 'Inside content',
    });

    // Clean up outside file
    await fs.rm(outsideFile, { force: true });
  });
});

describe('writeAgentSkillIO', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'agentskills-io-write-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should write SKILL.md with verbatim AgentSkills.io format', async () => {
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'deploy',
      description: 'Deploy the application',
      resources: ['checklist.md'],
    };
    const content = 'Deploy instructions.';
    const files = { 'checklist.md': 'Checklist content' };

    const outputDir = path.join(testDir, 'deploy');
    await writeAgentSkillIO(outputDir, frontmatter, content, files);

    // Check SKILL.md exists and contains correct frontmatter
    const skillPath = path.join(outputDir, 'SKILL.md');
    const skillContent = await fs.readFile(skillPath, 'utf-8');

    // Should NOT include IR fields (version, type, relativeDir)
    expect(skillContent).not.toContain('version:');
    expect(skillContent).not.toContain('type:');
    expect(skillContent).not.toContain('relativeDir:');

    // Should include AgentSkills.io fields
    expect(skillContent).toContain('name: deploy');
    expect(skillContent).toContain('description: Deploy the application');
    expect(skillContent).toContain('resources:');
    expect(skillContent).toContain('Deploy instructions.');
  });

  it('should write resource files to skill directory', async () => {
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'test',
      description: 'Test skill',
      resources: ['file1.md', 'file2.json'],
    };
    const files = {
      'file1.md': 'File 1 content',
      'file2.json': '{"test": true}',
    };

    const outputDir = path.join(testDir, 'test');
    await writeAgentSkillIO(outputDir, frontmatter, 'Content', files);

    const file1 = await fs.readFile(path.join(outputDir, 'file1.md'), 'utf-8');
    const file2 = await fs.readFile(path.join(outputDir, 'file2.json'), 'utf-8');

    expect(file1).toBe('File 1 content');
    expect(file2).toBe('{"test": true}');
  });

  it('should handle disableModelInvocation field', async () => {
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'review',
      description: 'Review code',
      disableModelInvocation: true,
    };

    const outputDir = path.join(testDir, 'review');
    await writeAgentSkillIO(outputDir, frontmatter, 'Review content', {});

    const skillPath = path.join(outputDir, 'SKILL.md');
    const skillContent = await fs.readFile(skillPath, 'utf-8');

    expect(skillContent).toContain('disable-model-invocation: true');
  });

  it('should create skill directory if it does not exist', async () => {
    const outputDir = path.join(testDir, 'nested', 'skill');
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'test',
      description: 'Test',
    };

    await writeAgentSkillIO(outputDir, frontmatter, 'Content', {});

    const skillPath = path.join(outputDir, 'SKILL.md');
    const exists = await fs
      .access(skillPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it('should write spec fields using spec key names', async () => {
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'deploy',
      description: 'Deploy the application',
      license: 'Apache-2.0',
      compatibility: 'Requires Python 3.14+ and uv',
      specMetadata: { author: 'Texarkanine', version: '1.2.0' },
      allowedTools: 'Bash(git:*) Bash(jq:*) Read',
    };

    const outputDir = path.join(testDir, 'deploy');
    await writeAgentSkillIO(outputDir, frontmatter, 'Content', {});

    const skillContent = await fs.readFile(path.join(outputDir, 'SKILL.md'), 'utf-8');

    expect(skillContent).toContain('license: Apache-2.0');
    expect(skillContent).toContain('compatibility: Requires Python 3.14+ and uv');
    expect(skillContent).toContain('metadata:');
    expect(skillContent).toContain('author: Texarkanine');
    // YAML-quotes the value; the round-trip test pins that it reads back intact.
    expect(skillContent).toMatch(/^allowed-tools: .*Bash\(git:\*\) Bash\(jq:\*\) Read/m);

    // Spec key names, never the IR property names.
    expect(skillContent).not.toContain('allowedTools');
    expect(skillContent).not.toContain('specMetadata');
  });

  it('should omit spec fields that are absent', async () => {
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'plain',
      description: 'Plain skill',
    };

    const outputDir = path.join(testDir, 'plain');
    await writeAgentSkillIO(outputDir, frontmatter, 'Content', {});

    const skillContent = await fs.readFile(path.join(outputDir, 'SKILL.md'), 'utf-8');

    expect(skillContent).not.toContain('license:');
    expect(skillContent).not.toContain('compatibility:');
    expect(skillContent).not.toContain('metadata:');
    expect(skillContent).not.toContain('allowed-tools:');
  });

  it('should prevent path traversal attacks in resource writes', async () => {
    const outputDir = path.join(testDir, 'safe');
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'test',
      description: 'Test skill',
    };

    // Attempt to write with path traversal
    const maliciousFiles = {
      '../malicious.txt': 'Malicious content',
    };

    await expect(
      writeAgentSkillIO(outputDir, frontmatter, 'Content', maliciousFiles)
    ).rejects.toThrow('Invalid resource path');

    // Verify no file was written outside the output directory
    const maliciousPath = path.join(testDir, 'malicious.txt');
    const exists = await fs
      .access(maliciousPath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(false);
  });
});

describe('readAgentSkillIO', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(tmpdir(), 'agentskills-io-read-test-'));
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should read SKILL.md and resource files', async () => {
    const skillDir = path.join(testDir, 'deploy');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: deploy
description: Deploy app
resources:
  - checklist.md
---

Deploy instructions.`
    );
    await fs.writeFile(path.join(skillDir, 'checklist.md'), 'Checklist');

    const result = await readAgentSkillIO(skillDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter.name).toBe('deploy');
      expect(result.skill.frontmatter.description).toBe('Deploy app');
      expect(result.skill.content).toBe('Deploy instructions.');
      expect(result.skill.files['checklist.md']).toBe('Checklist');
    }
  });

  it('should parse AgentSkills.io frontmatter correctly', async () => {
    const skillDir = path.join(testDir, 'simple');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: simple
description: Simple skill
---

Simple content.`
    );

    const result = await readAgentSkillIO(skillDir);
    expect(result.success).toBe(true);
    if (result.success) {
      // Should NOT have IR fields
      expect(result.skill.frontmatter).not.toHaveProperty('version');
      expect(result.skill.frontmatter).not.toHaveProperty('type');
      expect(result.skill.frontmatter).not.toHaveProperty('relativeDir');
    }
  });

  it('should return error if SKILL.md not found', async () => {
    const skillDir = path.join(testDir, 'empty');
    await fs.mkdir(skillDir, { recursive: true });

    const result = await readAgentSkillIO(skillDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('SKILL.md');
    }
  });

  it('should read spec fields written by writeAgentSkillIO', async () => {
    const skillDir = path.join(testDir, 'roundtrip');
    const frontmatter: ParsedSkillFrontmatter = {
      name: 'roundtrip',
      description: 'Round-trip skill',
      resources: ['note.md'],
      disableModelInvocation: true,
      license: 'Proprietary. LICENSE.txt has complete terms',
      compatibility: 'Requires Python 3.14+ and uv',
      specMetadata: { author: 'Texarkanine', version: '1.2.0' },
      allowedTools: 'Bash(git:*) Bash(jq:*) Read',
    };

    await writeAgentSkillIO(skillDir, frontmatter, 'Body text.', { 'note.md': 'Note' });

    const result = await readAgentSkillIO(skillDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.frontmatter).toEqual(frontmatter);
      expect(result.skill.content).toBe('Body text.');
    }
  });

  it('should read all resource files listed in frontmatter', async () => {
    const skillDir = path.join(testDir, 'multi');
    await fs.mkdir(skillDir, { recursive: true });
    await fs.writeFile(
      path.join(skillDir, 'SKILL.md'),
      `---
name: multi
description: Multi-resource skill
resources:
  - file1.md
  - file2.txt
  - file3.json
---

Content.`
    );
    await fs.writeFile(path.join(skillDir, 'file1.md'), 'File 1');
    await fs.writeFile(path.join(skillDir, 'file2.txt'), 'File 2');
    await fs.writeFile(path.join(skillDir, 'file3.json'), '{}');

    const result = await readAgentSkillIO(skillDir);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.skill.files).toEqual({
        'file1.md': 'File 1',
        'file2.txt': 'File 2',
        'file3.json': '{}',
      });
    }
  });
});
