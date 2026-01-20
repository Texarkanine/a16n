import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type DiscoveryResult,
  type Warning,
  CustomizationType,
  createId,
} from '@a16n/models';
import { parseMdc, type MdcFrontmatter } from './mdc.js';

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Find all .mdc files in a directory.
 */
async function findMdcFiles(rulesDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(rulesDir, { withFileTypes: true });
    return entries
      .filter(entry => entry.isFile() && entry.name.endsWith('.mdc'))
      .map(entry => entry.name);
  } catch {
    return [];
  }
}

/**
 * Classify a Cursor rule based on its frontmatter.
 * Phase 1: Only GlobalPrompt (alwaysApply: true or no criteria).
 * Phase 2 will add AgentSkill and FileRule classification.
 */
function classifyRule(
  frontmatter: MdcFrontmatter,
  body: string,
  sourcePath: string
): AgentCustomization {
  // For Phase 1, we only handle GlobalPrompt (alwaysApply: true)
  // In Phase 2, we'll add classification for globs and description
  
  return {
    id: createId(CustomizationType.GlobalPrompt, sourcePath),
    type: CustomizationType.GlobalPrompt,
    sourcePath,
    content: body,
    metadata: { ...frontmatter },
  };
}

/**
 * Discover all Cursor rules in a project directory.
 */
export async function discover(root: string): Promise<DiscoveryResult> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  // Find .cursor/rules/*.mdc files
  const rulesDir = path.join(root, '.cursor', 'rules');
  const mdcFiles = await findMdcFiles(rulesDir);

  for (const file of mdcFiles) {
    const filePath = path.join(rulesDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMdc(content);

    // For Phase 1, only process alwaysApply: true rules
    if (frontmatter.alwaysApply === true) {
      const relativePath = `.cursor/rules/${file}`;
      const item = classifyRule(frontmatter, body, relativePath);
      items.push(item);
    }
  }

  // Check for legacy .cursorrules file
  const legacyPath = path.join(root, '.cursorrules');
  if (await fileExists(legacyPath)) {
    const content = await fs.readFile(legacyPath, 'utf-8');
    items.push({
      id: createId(CustomizationType.GlobalPrompt, '.cursorrules'),
      type: CustomizationType.GlobalPrompt,
      sourcePath: '.cursorrules',
      content: content.trim(),
      metadata: { legacy: true },
    });
  }

  return { items, warnings };
}
