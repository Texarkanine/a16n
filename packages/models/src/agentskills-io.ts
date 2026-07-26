/**
 * Shared utilities for parsing and writing AgentSkills.io format.
 * This module handles the verbatim AgentSkills.io format WITHOUT IR frontmatter.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import matter from 'gray-matter';
import type { AgentSkillSpecFields } from './types.js';

/**
 * Parsed frontmatter from an AgentSkills.io SKILL.md file.
 * This is the VERBATIM AgentSkills.io format, NOT the IR format.
 */
export interface ParsedSkillFrontmatter extends AgentSkillSpecFields {
  /** Skill name (required) */
  name: string;
  /** Skill description for activation matching (required) */
  description: string;
  /** Resource file paths relative to skill directory (optional) */
  resources?: string[];
  /** If true, only invoked via /name (optional) */
  disableModelInvocation?: boolean;
}

/**
 * Coerce a parsed `metadata:` map to the spec's string→string shape.
 *
 * YAML types unquoted scalars, so `version: 1.0` arrives as a number. Primitives
 * are stringified; anything structural (nested map, sequence, null) is malformed
 * against the spec and is dropped rather than rendered as `[object Object]`.
 *
 * @returns The coerced map, or `undefined` if nothing usable survived.
 */
function coerceSpecMetadata(value: unknown): Record<string, string> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }

  const coerced: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (typeof raw === 'string') {
      coerced[key] = raw;
    } else if (typeof raw === 'number' || typeof raw === 'boolean') {
      coerced[key] = String(raw);
    }
  }

  return Object.keys(coerced).length > 0 ? coerced : undefined;
}

/**
 * Extract the optional AgentSkills.io spec fields from parsed YAML frontmatter.
 *
 * Shared by every plugin that reads a `SKILL.md`, so the spec key names and the
 * `metadata` coercion rule are defined exactly once.
 *
 * @param data - Frontmatter key-values as produced by gray-matter
 * @returns Only the spec fields that were present and well-formed
 *
 * @example
 * extractSpecFields({ license: 'MIT', 'allowed-tools': 'Read' })
 * // { license: 'MIT', allowedTools: 'Read' }
 */
export function extractSpecFields(data: Record<string, unknown>): AgentSkillSpecFields {
  const fields: AgentSkillSpecFields = {};

  if (typeof data.license === 'string') fields.license = data.license;
  if (typeof data.compatibility === 'string') fields.compatibility = data.compatibility;
  if (typeof data['allowed-tools'] === 'string') fields.allowedTools = data['allowed-tools'];

  const specMetadata = coerceSpecMetadata(data.metadata);
  if (specMetadata) fields.specMetadata = specMetadata;

  return fields;
}

/**
 * A parsed AgentSkills.io skill with content and frontmatter.
 */
export interface ParsedSkill {
  /** Parsed frontmatter */
  frontmatter: ParsedSkillFrontmatter;
  /** Skill content after frontmatter */
  content: string;
}

/**
 * Parse the frontmatter from an AgentSkills.io SKILL.md file.
 *
 * This parses the VERBATIM AgentSkills.io format:
 * - name (required)
 * - description (required)
 * - resources (optional)
 * - disable-model-invocation (optional)
 * - license, compatibility, metadata, allowed-tools (optional spec fields)
 *
 * The spec's `metadata` key lands on `specMetadata` to keep it distinct from the
 * IR's transient `metadata`.
 *
 * It does NOT parse IR-specific fields (version, type, relativeDir).
 *
 * @param fileContent - The complete SKILL.md file content
 * @returns Parsed skill or error message
 *
 * @example
 * const content = `---
 * name: deploy
 * description: Deploy the application
 * resources:
 *   - checklist.md
 * ---
 * 
 * Deploy instructions...`;
 *
 * parseSkillFrontmatter(content)
 * // { frontmatter: { name: 'deploy', description: '...', resources: ['checklist.md'] }, content: 'Deploy instructions...' }
 */
export function parseSkillFrontmatter(
  fileContent: string
): { success: true; skill: ParsedSkill } | { success: false; error: string } {
  try {
    const parsed = matter(fileContent);
    const data = parsed.data as Record<string, unknown>;

    // Validate required fields
    if (typeof data.name !== 'string') {
      return { success: false, error: 'Missing required field: name' };
    }
    if (typeof data.description !== 'string') {
      return { success: false, error: 'Missing required field: description' };
    }

    // Parse optional fields
    const frontmatter: ParsedSkillFrontmatter = {
      name: data.name,
      description: data.description,
    };

    if (Array.isArray(data.resources)) {
      frontmatter.resources = data.resources;
    }

    if (typeof data['disable-model-invocation'] === 'boolean') {
      frontmatter.disableModelInvocation = data['disable-model-invocation'];
    }

    Object.assign(frontmatter, extractSpecFields(data));

    return {
      success: true,
      skill: {
        frontmatter,
        content: parsed.content.trim(),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse frontmatter',
    };
  }
}

/**
 * Read resource files from a skill directory.
 *
 * @param skillDir - Absolute path to the skill directory
 * @param resources - Array of resource file paths (relative to skillDir)
 * @returns Map of relative path to file content
 *
 * @example
 * readSkillFiles('/path/to/skill', ['checklist.md', 'config.json'])
 * // { 'checklist.md': '...', 'config.json': '...' }
 */
export async function readSkillFiles(
  skillDir: string,
  resources: string[]
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const resolvedSkillDir = path.resolve(skillDir);

  for (const resource of resources) {
    const resourcePath = path.join(skillDir, resource);
    const resolvedResource = path.resolve(resourcePath);

    // Validate path stays within skillDir to prevent path traversal
    if (!resolvedResource.startsWith(resolvedSkillDir + path.sep) && resolvedResource !== resolvedSkillDir) {
      continue; // Skip paths that escape the skill directory
    }

    try {
      const content = await fs.readFile(resourcePath, 'utf-8');
      files[resource] = content;
    } catch (error) {
      // Skip missing files gracefully
      continue;
    }
  }

  return files;
}

/**
 * Write an AgentSkillIO to disk in verbatim AgentSkills.io format.
 *
 * This writes the VERBATIM AgentSkills.io format:
 * - SKILL.md with name, description, resources, disable-model-invocation,
 *   license, compatibility, metadata, allowed-tools
 * - Resource files in the skill directory
 *
 * It does NOT write IR-specific fields (version, type, relativeDir).
 *
 * @param outputDir - Directory to write the skill (e.g., .a16n/agent-skill-io/NAME)
 * @param frontmatter - Skill frontmatter (AgentSkills.io format)
 * @param content - Skill content
 * @param files - Resource files to write (key: relative path, value: content)
 * @returns Array of written file paths
 *
 * @example
 * await writeAgentSkillIO(
 *   '.a16n/agent-skill-io/deploy',
 *   { name: 'deploy', description: 'Deploy app', resources: ['checklist.md'] },
 *   'Deploy instructions...',
 *   { 'checklist.md': 'Checklist content...' }
 * )
 */
export async function writeAgentSkillIO(
  outputDir: string,
  frontmatter: ParsedSkillFrontmatter,
  content: string,
  files: Record<string, string>
): Promise<string[]> {
  const written: string[] = [];

  // Create output directory
  await fs.mkdir(outputDir, { recursive: true });

  // Build YAML frontmatter (AgentSkills.io format, NO IR fields)
  const yamlData: Record<string, unknown> = {
    name: frontmatter.name,
    description: frontmatter.description,
  };

  if (frontmatter.resources) {
    yamlData.resources = frontmatter.resources;
  }

  if (frontmatter.disableModelInvocation) {
    yamlData['disable-model-invocation'] = frontmatter.disableModelInvocation;
  }

  if (frontmatter.license) {
    yamlData.license = frontmatter.license;
  }

  if (frontmatter.compatibility) {
    yamlData.compatibility = frontmatter.compatibility;
  }

  if (frontmatter.specMetadata && Object.keys(frontmatter.specMetadata).length > 0) {
    yamlData.metadata = frontmatter.specMetadata;
  }

  if (frontmatter.allowedTools) {
    yamlData['allowed-tools'] = frontmatter.allowedTools;
  }

  // Write SKILL.md with gray-matter
  const skillContent = matter.stringify(content, yamlData);
  const skillPath = path.join(outputDir, 'SKILL.md');
  await fs.writeFile(skillPath, skillContent, 'utf-8');
  written.push(skillPath);

  // Write resource files
  const resolvedOutputDir = path.resolve(outputDir);
  for (const [relativePath, fileContent] of Object.entries(files)) {
    const filePath = path.join(outputDir, relativePath);
    const resolvedFilePath = path.resolve(filePath);

    // Validate path stays within outputDir to prevent path traversal
    if (!resolvedFilePath.startsWith(resolvedOutputDir + path.sep) && resolvedFilePath !== resolvedOutputDir) {
      throw new Error(`Invalid resource path: ${relativePath} escapes output directory`);
    }

    const fileDir = path.dirname(filePath);
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, fileContent, 'utf-8');
    written.push(filePath);
  }

  return written;
}

/**
 * Read an AgentSkillIO from disk in verbatim AgentSkills.io format.
 *
 * This reads the VERBATIM AgentSkills.io format from:
 * - SKILL.md with name, description, resources, disable-model-invocation
 * - Resource files in the skill directory
 *
 * It does NOT expect IR-specific fields (version, type, relativeDir).
 *
 * @param skillDir - Directory containing the skill (e.g., .a16n/agent-skill-io/NAME)
 * @returns Parsed skill with frontmatter, content, and resource files
 *
 * @example
 * await readAgentSkillIO('.a16n/agent-skill-io/deploy')
 * // {
 * //   frontmatter: { name: 'deploy', description: '...', resources: ['checklist.md'] },
 * //   content: 'Deploy instructions...',
 * //   files: { 'checklist.md': 'Checklist content...' }
 * // }
 */
export async function readAgentSkillIO(
  skillDir: string
): Promise<
  | { success: true; skill: ParsedSkill & { files: Record<string, string> } }
  | { success: false; error: string }
> {
  try {
    // Read SKILL.md
    const skillPath = path.join(skillDir, 'SKILL.md');
    const skillContent = await fs.readFile(skillPath, 'utf-8');

    // Parse frontmatter
    const parseResult = parseSkillFrontmatter(skillContent);
    if (!parseResult.success) {
      return parseResult;
    }

    // Read resource files
    const resources = parseResult.skill.frontmatter.resources || [];
    const files = await readSkillFiles(skillDir, resources);

    return {
      success: true,
      skill: {
        ...parseResult.skill,
        files,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Failed to read SKILL.md: ${error.message}`
          : 'Failed to read SKILL.md',
    };
  }
}
