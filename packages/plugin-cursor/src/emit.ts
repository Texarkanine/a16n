import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type EmitResult,
  type WrittenFile,
  type Warning,
  CustomizationType,
  isGlobalPrompt,
} from '@a16n/models';

/**
 * Sanitize a filename to be safe for the filesystem.
 * Converts to lowercase, replaces spaces and special chars with hyphens.
 */
function sanitizeFilename(sourcePath: string): string {
  // Get just the filename without directory
  const basename = path.basename(sourcePath);
  
  // Remove extension
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');
  
  // Convert to lowercase and replace unsafe characters
  return nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
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

  // Emit each GlobalPrompt as a separate .mdc file
  for (const gp of globalPrompts) {
    const filename = sanitizeFilename(gp.sourcePath) + '.mdc';
    const filepath = path.join(rulesDir, filename);
    const content = formatMdc(gp.content);

    await fs.writeFile(filepath, content, 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
    });
  }

  return { written, warnings, unsupported };
}
