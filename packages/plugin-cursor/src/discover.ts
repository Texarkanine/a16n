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
 * Recursively find all .mdc files in a directory and its subdirectories.
 * Returns paths relative to the rulesDir (e.g., "shared/core.mdc").
 * 
 * NOTE: This only searches within the given rulesDir. Finding nested
 * .cursor/rules/ directories elsewhere in the project is a future enhancement.
 */
async function findMdcFiles(rulesDir: string, relativePath: string = ''): Promise<string[]> {
  const results: string[] = [];
  
  try {
    const entries = await fs.readdir(path.join(rulesDir, relativePath), { withFileTypes: true });
    
    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isFile() && entry.name.endsWith('.mdc')) {
        results.push(entryRelativePath);
      } else if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findMdcFiles(rulesDir, entryRelativePath);
        results.push(...subFiles);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return results;
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
      const sourcePath = `.cursor/rules/${file}`;
      const item = classifyRule(frontmatter, body, sourcePath);
      items.push(item);
    }
  }

  return { items, warnings };
}
