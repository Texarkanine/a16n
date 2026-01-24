import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type EmitResult,
  type WrittenFile,
  type Warning,
  CustomizationType,
  WarningCode,
  isGlobalPrompt,
} from '@a16n/models';

/**
 * Sanitize a filename to be safe for the filesystem.
 * Converts to lowercase, replaces spaces and special chars with hyphens.
 * Returns 'rule' if sanitization produces an empty string.
 */
function sanitizeFilename(sourcePath: string): string {
  // Get just the filename without directory
  const basename = path.basename(sourcePath);
  
  // Remove extension
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');
  
  // Convert to lowercase and replace unsafe characters
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  
  // Return fallback if empty
  return sanitized || 'rule';
}

/**
 * Generate a unique filename by appending a counter if needed.
 * Returns the unique filename and whether a collision occurred.
 */
function getUniqueFilename(
  baseName: string,
  usedNames: Set<string>
): { filename: string; collision: boolean } {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return { filename: baseName, collision: false };
  }

  // Collision detected - find unique name
  let counter = 2;
  let uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  while (usedNames.has(uniqueName)) {
    counter++;
    uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  }
  usedNames.add(uniqueName);
  return { filename: uniqueName, collision: true };
}

/**
 * Format content as MDC with frontmatter.
 */
function formatMdc(content: string, alwaysApply: boolean = true): string {
  return `---
alwaysApply: ${alwaysApply}
---

${content}
`;
}

/**
 * Emit agent customizations to Cursor format.
 */
export async function emit(
  models: AgentCustomization[],
  root: string
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];
  const usedFilenames = new Set<string>();

  // Filter to GlobalPrompt items only (Phase 1)
  const globalPrompts = models.filter(isGlobalPrompt);
  
  // Track items that aren't GlobalPrompt as unsupported for Phase 1
  for (const model of models) {
    if (!isGlobalPrompt(model)) {
      unsupported.push(model);
    }
  }

  if (globalPrompts.length === 0) {
    return { written, warnings, unsupported };
  }

  // Ensure .cursor/rules directory exists
  const rulesDir = path.join(root, '.cursor', 'rules');
  await fs.mkdir(rulesDir, { recursive: true });

  // Track sources that had collisions for warning
  const collisionSources: string[] = [];

  // Emit each GlobalPrompt as a separate .mdc file
  for (const gp of globalPrompts) {
    const baseName = sanitizeFilename(gp.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(gp.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
    const content = formatMdc(gp.content);

    await fs.writeFile(filepath, content, 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
    });
  }

  // Emit warning if any collisions occurred
  if (collisionSources.length > 0) {
    warnings.push({
      code: WarningCode.FileRenamed,
      message: `Filename collision: ${collisionSources.length} file(s) renamed to avoid overwrite`,
      sources: collisionSources,
    });
  }

  return { written, warnings, unsupported };
}
