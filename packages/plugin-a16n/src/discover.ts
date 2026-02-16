/**
 * IR Discovery - Read intermediate representation from .a16n/ directory
 * 
 * This module implements the discover() function for the a16n plugin,
 * which reads IR items from the .a16n/ directory structure on disk.
 * 
 * This is the inverse of emit():
 * - Scans type directories in .a16n/
 * - Parses frontmatter files via parseIRFile()
 * - Handles AgentSkillIO verbatim format via readAgentSkillIO()
 * - Validates versions with areVersionsCompatible()
 * - Produces warnings for issues (unknown dirs, bad frontmatter, version mismatch)
 * 
 * Directory structure: .a16n/<type>/<name>.md
 * - Type directories use kebab-case matching CustomizationType enum values
 * - AgentSkillIO uses subdirectory-per-skill with verbatim AgentSkills.io format
 * - Other types use YAML frontmatter parsed by parseIRFile()
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentSkillIO,
  type DiscoveryResult,
  type Warning,
  type Workspace,
  CustomizationType,
  WarningCode,
  CURRENT_IR_VERSION,
  areVersionsCompatible,
  readAgentSkillIO,
  createId,
  resolveRoot,
} from '@a16njs/models';
import { parseIRFile } from './parse.js';
import { extractRelativeDir } from './utils.js';

/** Set of valid CustomizationType enum values for directory name validation */
const VALID_TYPE_DIRS = new Set<string>(Object.values(CustomizationType));

/**
 * Discover IR items from .a16n/ directory structure.
 * 
 * Scans the .a16n/ directory in the given root, parsing each type subdirectory
 * and returning all discovered IR items with any warnings.
 * 
 * @param root - Project root directory containing .a16n/
 * @returns DiscoveryResult with parsed IR items and warnings
 * 
 * @example
 * const result = await discover('/path/to/project');
 * // result.items: AgentCustomization[]
 * // result.warnings: Warning[]
 */
export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  const a16nDir = path.join(root, '.a16n');

  // Check if .a16n/ directory exists
  try {
    const stat = await fs.stat(a16nDir);
    if (!stat.isDirectory()) {
      return { items, warnings };
    }
  } catch {
    // .a16n/ does not exist
    return { items, warnings };
  }

  // Read top-level entries in .a16n/
  let entries;
  try {
    entries = await fs.readdir(a16nDir, { withFileTypes: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnings.push({
      code: WarningCode.Skipped,
      message: `Could not read .a16n/ directory: ${message}`,
      sources: ['.a16n'],
    });
    return { items, warnings };
  }

  for (const entry of entries) {
    // Skip non-directory entries (files directly in .a16n/)
    if (!entry.isDirectory()) {
      continue;
    }

    const dirName = entry.name;

    // Validate against known CustomizationType values
    if (!VALID_TYPE_DIRS.has(dirName)) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Unknown type directory "${dirName}" in .a16n/ — skipping`,
        sources: [`.a16n/${dirName}`],
      });
      continue;
    }

    const type = dirName as CustomizationType;
    const typeDir = path.join(a16nDir, dirName);

    if (type === CustomizationType.AgentSkillIO) {
      // AgentSkillIO uses readAgentSkillIO() (verbatim AgentSkills.io format)
      const result = await discoverAgentSkillIO(typeDir);
      items.push(...result.items);
      warnings.push(...result.warnings);
    } else {
      // All other types use parseIRFile() with YAML frontmatter
      const result = await discoverStandardType(typeDir, type);
      items.push(...result.items);
      warnings.push(...result.warnings);
    }
  }

  return { items, warnings };
}

/**
 * Discover standard IR files (all types except AgentSkillIO) from a type directory.
 * 
 * Recursively scans the type directory for .md files, parses each via parseIRFile(),
 * validates version compatibility, and collects warnings for issues.
 * 
 * @param typeDir - Absolute path to the type directory (e.g., /project/.a16n/global-prompt/)
 * @param type - The CustomizationType for items in this directory
 * @returns Items and warnings discovered from this type directory
 */
async function discoverStandardType(
  typeDir: string,
  type: CustomizationType
): Promise<{ items: AgentCustomization[]; warnings: Warning[] }> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  // Find all .md files recursively (pass warnings to surface readdir errors)
  const mdFiles = await findMdFiles(typeDir, '', warnings);

  for (const relativeMdPath of mdFiles) {
    const filepath = path.join(typeDir, relativeMdPath);
    const filename = path.basename(relativeMdPath);

    // Compute the relativePath for parseIRFile (path relative to project root's .a16n/)
    // e.g., ".a16n/global-prompt" or ".a16n/global-prompt/shared/company"
    const dirOfFile = path.dirname(filepath);
    const a16nRoot = path.dirname(typeDir); // The .a16n/ directory
    const relativeToA16n = path.relative(a16nRoot, dirOfFile).split(path.sep).join('/');
    const relativePath = `.a16n/${relativeToA16n}`;

    // Parse the IR file
    const result = await parseIRFile(filepath, filename, relativePath);

    if (result.error) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped "${relativeMdPath}" in ${type}: ${result.error}`,
        sources: [`.a16n/${type}/${relativeMdPath}`],
      });
      continue;
    }

    if (!result.item) {
      continue;
    }

    const item = result.item;

    // Validate version compatibility
    if (!areVersionsCompatible(CURRENT_IR_VERSION, item.version)) {
      warnings.push({
        code: WarningCode.VersionMismatch,
        message: `Version mismatch in ".a16n/${type}/${relativeMdPath}": file has ${item.version}, reader is ${CURRENT_IR_VERSION}`,
        sources: [`.a16n/${type}/${relativeMdPath}`],
      });
      // Still include the item (per design decision: items with version mismatch are still processed)
    }

    items.push(item);
  }

  return { items, warnings };
}

/**
 * Discover AgentSkillIO items from the agent-skill-io type directory.
 * 
 * Lists subdirectories in .a16n/agent-skill-io/, reads each via readAgentSkillIO(),
 * and constructs AgentSkillIO IR items.
 * 
 * @param agentSkillIODir - Absolute path to .a16n/agent-skill-io/
 * @returns Items and warnings discovered from AgentSkillIO directories
 */
async function discoverAgentSkillIO(
  agentSkillIODir: string
): Promise<{ items: AgentSkillIO[]; warnings: Warning[] }> {
  const items: AgentSkillIO[] = [];
  const warnings: Warning[] = [];

  let entries;
  try {
    entries = await fs.readdir(agentSkillIODir, { withFileTypes: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    warnings.push({
      code: WarningCode.Skipped,
      message: `Could not read AgentSkillIO directory: ${message}`,
      sources: ['.a16n/agent-skill-io'],
    });
    return { items, warnings };
  }

  for (const entry of entries) {
    // Only process directories (each is a skill)
    if (!entry.isDirectory()) {
      continue;
    }

    const skillDirName = entry.name;
    const skillDir = path.join(agentSkillIODir, skillDirName);
    const sourcePath = `.a16n/agent-skill-io/${skillDirName}/SKILL.md`;

    // Read skill using shared readAgentSkillIO utility
    const result = await readAgentSkillIO(skillDir);

    if (!result.success) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped AgentSkillIO "${skillDirName}": ${result.error}`,
        sources: [`.a16n/agent-skill-io/${skillDirName}`],
      });
      continue;
    }

    const { skill } = result;

    // Construct AgentSkillIO IR item
    const agentSkillIO: AgentSkillIO = {
      id: createId(CustomizationType.AgentSkillIO, sourcePath),
      type: CustomizationType.AgentSkillIO,
      version: CURRENT_IR_VERSION, // AgentSkills.io format has no version field
      sourcePath,
      content: skill.content,
      name: skill.frontmatter.name,
      description: skill.frontmatter.description,
      disableModelInvocation: skill.frontmatter.disableModelInvocation,
      resources: skill.frontmatter.resources,
      files: skill.files,
      metadata: {},
    };

    items.push(agentSkillIO);
  }

  return { items, warnings };
}

/**
 * Recursively find all .md files in a directory.
 * Returns paths relative to the given base directory.
 *
 * @param dir - Directory to scan
 * @param relativePath - Current relative path (for recursion)
 * @param warnings - Optional warnings array to report readdir failures
 * @returns Array of relative paths to .md files
 */
async function findMdFiles(
  dir: string,
  relativePath: string = '',
  warnings?: Warning[]
): Promise<string[]> {
  const results: string[] = [];
  const targetDir = path.join(dir, relativePath);

  try {
    const entries = await fs.readdir(targetDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;

      if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(entryRelativePath);
      } else if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findMdFiles(dir, entryRelativePath, warnings);
        results.push(...subFiles);
      }
    }
  } catch (err) {
    // Surface readdir failures as warnings when a warnings accumulator is provided
    if (warnings) {
      const dirLabel = relativePath || path.basename(dir);
      const typeName = path.basename(dir);
      const relativeSource = relativePath
        ? `.a16n/${typeName}/${relativePath}`
        : `.a16n/${typeName}`;
      const message = err instanceof Error ? err.message : String(err);
      warnings.push({
        code: WarningCode.Skipped,
        message: `Could not read directory "${dirLabel}": ${message}`,
        sources: [relativeSource],
      });
    }
  }

  return results;
}
