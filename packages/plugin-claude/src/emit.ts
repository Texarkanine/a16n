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
 * Emit agent customizations to Claude format.
 * Merges all GlobalPrompts into a single CLAUDE.md file.
 */
export async function emit(
  models: AgentCustomization[],
  root: string
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];

  // Filter to GlobalPrompt items only
  const globalPrompts = models.filter(isGlobalPrompt);

  // Track items that aren't GlobalPrompt as unsupported
  for (const model of models) {
    if (!isGlobalPrompt(model)) {
      unsupported.push(model);
    }
  }

  if (globalPrompts.length === 0) {
    return { written, warnings, unsupported };
  }

  // Merge all GlobalPrompts into single CLAUDE.md
  const sections = globalPrompts.map((gp) => {
    const header = `## From: ${gp.sourcePath}`;
    return `${header}\n\n${gp.content}`;
  });

  const content = sections.join('\n\n---\n\n');
  const claudePath = path.join(root, 'CLAUDE.md');

  await fs.writeFile(claudePath, content, 'utf-8');

  written.push({
    path: claudePath,
    type: CustomizationType.GlobalPrompt,
    itemCount: globalPrompts.length,
  });

  // Emit warning if multiple items merged
  if (globalPrompts.length > 1) {
    warnings.push({
      code: WarningCode.Merged,
      message: `Merged ${globalPrompts.length} items into single CLAUDE.md`,
      sources: globalPrompts.map((gp) => gp.sourcePath),
    });
  }

  return { written, warnings, unsupported };
}
