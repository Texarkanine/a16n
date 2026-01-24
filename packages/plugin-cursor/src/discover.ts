import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type DiscoveryResult,
  type Warning,
  type FileRule,
  type AgentSkill,
  type GlobalPrompt,
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
 * Parse comma-separated glob patterns into an array.
 * Handles various formats: "*.ts,*.tsx" or "*.ts, *.tsx"
 */
function parseGlobs(globsString: string): string[] {
  return globsString
    .split(',')
    .map(g => g.trim())
    .filter(g => g.length > 0);
}

/**
 * Classify a Cursor rule based on its frontmatter.
 * 
 * Classification priority:
 * 1. alwaysApply: true → GlobalPrompt
 * 2. globs: present → FileRule
 * 3. description: present → AgentSkill
 * 4. None of above → GlobalPrompt (fallback)
 */
function classifyRule(
  frontmatter: MdcFrontmatter,
  body: string,
  sourcePath: string
): AgentCustomization {
  // Priority 1: alwaysApply: true → GlobalPrompt
  if (frontmatter.alwaysApply === true) {
    return {
      id: createId(CustomizationType.GlobalPrompt, sourcePath),
      type: CustomizationType.GlobalPrompt,
      sourcePath,
      content: body,
      metadata: { ...frontmatter },
    } as GlobalPrompt;
  }

  // Priority 2: globs present → FileRule
  if (frontmatter.globs) {
    const globs = parseGlobs(frontmatter.globs);
    return {
      id: createId(CustomizationType.FileRule, sourcePath),
      type: CustomizationType.FileRule,
      sourcePath,
      content: body,
      globs,
      metadata: { ...frontmatter },
    } as FileRule;
  }

  // Priority 3: description present → AgentSkill
  if (frontmatter.description) {
    return {
      id: createId(CustomizationType.AgentSkill, sourcePath),
      type: CustomizationType.AgentSkill,
      sourcePath,
      content: body,
      description: frontmatter.description,
      metadata: { ...frontmatter },
    } as AgentSkill;
  }

  // Priority 4: Fallback → GlobalPrompt
  return {
    id: createId(CustomizationType.GlobalPrompt, sourcePath),
    type: CustomizationType.GlobalPrompt,
    sourcePath,
    content: body,
    metadata: { ...frontmatter },
  } as GlobalPrompt;
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

    // Classify and add all rules (Phase 2: supports GlobalPrompt, FileRule, AgentSkill)
    const sourcePath = `.cursor/rules/${file}`;
    const item = classifyRule(frontmatter, body, sourcePath);
    items.push(item);
  }

  return { items, warnings };
}
