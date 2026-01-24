import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type DiscoveryResult,
  type Warning,
  CustomizationType,
  createId,
} from '@a16n/models';

/**
 * Recursively find all CLAUDE.md files in a directory tree.
 */
async function findClaudeFiles(
  root: string,
  currentDir: string = ''
): Promise<string[]> {
  const results: string[] = [];
  const fullPath = currentDir ? path.join(root, currentDir) : root;

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip node_modules and hidden directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const relativePath = currentDir
        ? path.join(currentDir, entry.name)
        : entry.name;

      if (entry.isFile() && entry.name === 'CLAUDE.md') {
        results.push(relativePath);
      } else if (entry.isDirectory()) {
        const nested = await findClaudeFiles(root, relativePath);
        results.push(...nested);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return results;
}

/**
 * Discover all CLAUDE.md files in a project directory.
 */
export async function discover(root: string): Promise<DiscoveryResult> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  // Find all CLAUDE.md files
  const claudeFiles = await findClaudeFiles(root);

  for (const file of claudeFiles) {
    const fullPath = path.join(root, file);
    const content = await fs.readFile(fullPath, 'utf-8');

    // Calculate nesting depth
    const depth = file.split(path.sep).length - 1;
    const isNested = depth > 0;

    // Normalize path separators for cross-platform consistency
    const normalizedPath = file.split(path.sep).join('/');

    items.push({
      id: createId(CustomizationType.GlobalPrompt, normalizedPath),
      type: CustomizationType.GlobalPrompt,
      sourcePath: normalizedPath,
      content,
      metadata: {
        nested: isNested,
        depth,
      },
    });
  }

  return { items, warnings };
}
