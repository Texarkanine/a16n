/**
 * Shared utilities for parsing and writing AgentSkills.io format.
 * This module handles the verbatim AgentSkills.io format WITHOUT IR frontmatter.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import matter from 'gray-matter';

/**
 * Parsed frontmatter from an AgentSkills.io SKILL.md file.
 * This is the VERBATIM AgentSkills.io format, NOT the IR format.
 */
export interface ParsedSkillFrontmatter {
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
 * - SKILL.md with name, description, resources, disable-model-invocation
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
 * @param skillDir - Directory containing the skill (e.g., .a16n/agent-skill-io/<name>)
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
