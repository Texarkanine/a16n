/**
 * IR Emission - Write intermediate representation to .a16n/ directory
 * 
 * This module implements the emit() function for the a16n plugin,
 * which writes IR items to disk in the .a16n/ directory structure.
 * 
 * Directory structure: .a16n/<type>/<name>.md
 * - Type directories use kebab-case matching CustomizationType enum values
 * - Files have YAML frontmatter with version, type, and type-specific fields
 * - AgentSkillIO uses verbatim AgentSkills.io format (NO IR frontmatter)
 * - relativeDir field creates subdirectories to preserve structure
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentSkillIO,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
  type Warning,
  CustomizationType,
  WarningCode,
  isAgentSkillIO,
  isManualPrompt,
  writeAgentSkillIO,
} from '@a16njs/models';
import { formatIRFile } from './format.js';
import { slugify } from './utils.js';

/**
 * Check if a path exists on the filesystem.
 */
async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Emit IR items to .a16n/ directory structure.
 * 
 * @param models - IR items to emit
 * @param root - Project root directory
 * @param options - Emission options (dryRun, etc.)
 * @returns EmitResult with written files and warnings
 */
export async function emit(
  models: AgentCustomization[],
  root: string,
  options?: EmitOptions
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];
  const dryRun = options?.dryRun ?? false;

  // Group items by CustomizationType
  const byType = new Map<CustomizationType, AgentCustomization[]>();
  for (const item of models) {
    const items = byType.get(item.type) || [];
    items.push(item);
    byType.set(item.type, items);
  }

  // Process each type
  for (const [type, items] of byType.entries()) {
    // Base directory for this type (kebab-case matching enum value)
    const baseDir = path.join(root, '.a16n', type);

    for (const item of items) {
      try {
        if (isAgentSkillIO(item)) {
          // AgentSkillIO: use writeAgentSkillIO() for verbatim format
          await emitAgentSkillIO(item, baseDir, written, dryRun);
        } else {
          // All other types: use formatIRFile() for IR frontmatter
          await emitStandardIR(item, baseDir, written, dryRun);
        }
      } catch (error) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Failed to emit ${item.type} "${item.id}": ${error instanceof Error ? error.message : String(error)}`,
          sources: item.sourcePath ? [item.sourcePath] : [],
        });
      }
    }
  }

  return {
    written,
    warnings,
    unsupported,
  };
}

/**
 * Emit a standard IR item (all types except AgentSkillIO).
 * Uses formatIRFile() to generate YAML frontmatter + content.
 */
async function emitStandardIR(
  item: AgentCustomization,
  baseDir: string,
  written: WrittenFile[],
  dryRun: boolean
): Promise<void> {
  // Determine target directory (handle relativeDir subdirectories)
  // Validate that relativeDir doesn't escape baseDir via path traversal
  const baseDirResolved = path.resolve(baseDir);
  const targetDir = item.relativeDir
    ? path.resolve(baseDirResolved, item.relativeDir)
    : baseDirResolved;
  const rel = path.relative(baseDirResolved, targetDir);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Invalid relativeDir "${item.relativeDir}" (escapes ${baseDir})`);
  }

  // Extract name from ID and slugify for filename
  // For ManualPrompt with path separators, extract basename only
  const rawName = extractNameFromId(item.id);
  const name = isManualPrompt(item) ? path.basename(rawName) : rawName;
  const filename = `${slugify(name)}.md`;
  const filePath = path.join(targetDir, filename);
  const relativePath = path.relative(process.cwd(), filePath);

  // Format content with IR frontmatter
  const content = formatIRFile(item);

  // Check if file already exists before writing
  const existed = await pathExists(filePath);

  // Write file (unless dry-run)
  if (!dryRun) {
    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  written.push({
    path: filePath,
    type: item.type,
    itemCount: 1,
    isNewFile: !existed,
    sourceItems: [item],
  });
}

/**
 * Emit an AgentSkillIO item using verbatim AgentSkills.io format.
 * Uses writeAgentSkillIO() from @a16njs/models.
 */
async function emitAgentSkillIO(
  item: AgentSkillIO,
  baseDir: string,
  written: WrittenFile[],
  dryRun: boolean
): Promise<void> {
  // Extract name from ID and slugify for directory name
  const name = extractNameFromId(item.id);
  const skillDirName = slugify(name);
  const skillDir = path.join(baseDir, skillDirName);

  // Prepare frontmatter (AgentSkills.io format)
  const frontmatter = {
    name: skillDirName,
    description: item.description,
  };

  // Check if skill directory already exists before writing
  const existed = await pathExists(skillDir);

  // Write AgentSkillIO using shared utility (verbatim format)
  if (!dryRun) {
    await fs.mkdir(baseDir, { recursive: true });
    await writeAgentSkillIO(skillDir, frontmatter, item.content, item.files || {});
  }

  written.push({
    path: skillDir,
    type: item.type,
    itemCount: 1,
    isNewFile: !existed,
    sourceItems: [item],
  });
}

/**
 * Extract name from ID and strip file extension.
 * ID format: <type>:<name> or <type>:hash:<hash>
 * 
 * Example:
 * - 'global-prompt:.cursor/rules/blogging.mdc' -> '.cursor/rules/blogging'
 * - 'file-rule:typescript.mdc' -> 'typescript'
 */
function extractNameFromId(id: string): string {
  const parts = id.split(':');
  let name = id;
  
  if (parts.length >= 2) {
    // Skip first part (type) and return rest
    name = parts.slice(1).join(':');
  }
  
  // Strip file extension (e.g., .mdc, .md, .txt)
  // This ensures slugified names don't include the original extension
  return name.replace(/\.[^/.]+$/, '');
}
