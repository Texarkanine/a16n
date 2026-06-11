import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type DiscoveryResult,
  type FileRule,
  type GlobalPrompt,
  type Warning,
  type Workspace,
  CustomizationType,
  WarningCode,
  createId,
  inferGlobalPromptName,
  resolveRoot,
  CURRENT_IR_VERSION,
} from '@a16njs/models';

/**
 * Recursively find all AGENTS.md files in a directory tree.
 * Returns POSIX-style paths relative to root (e.g., "AGENTS.md", "web/AGENTS.md").
 *
 * Skips dot-directories (e.g. `.git`, `.cursor`) and `node_modules`,
 * matching the traversal rules of the other bundled plugins.
 */
async function findAgentsFiles(
  root: string,
  currentDir: string = ''
): Promise<string[]> {
  const results: string[] = [];
  const fullPath = currentDir ? path.join(root, currentDir) : root;

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const relativePath = currentDir
        ? `${currentDir}/${entry.name}`
        : entry.name;

      if (entry.isFile() && entry.name === 'AGENTS.md') {
        results.push(relativePath);
      } else if (entry.isDirectory()) {
        const nested = await findAgentsFiles(root, relativePath);
        results.push(...nested);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return results;
}

/**
 * Discover AGENTS.md files in a project directory tree.
 *
 * Mapping (see Issue #50 and the a16n IR model):
 * - Root `AGENTS.md` → GlobalPrompt (always-applied instructions)
 * - Nested `<dir>/AGENTS.md` → FileRule with `globs: ['<dir>/**']` and
 *   `relativeDir: '<dir>'` — the AGENTS.md standard scopes nested files to
 *   their subtree ("the closest AGENTS.md wins"), which the IR expresses as
 *   a directory-shaped glob. This is what lets nested AGENTS.md files
 *   convert into Cursor `globs:` rules and Claude `paths:` rules.
 *
 * @param rootOrWorkspace - Root directory path or Workspace instance
 * @returns All customizations found and any warnings
 */
export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  const agentsFiles = await findAgentsFiles(root);

  for (const file of agentsFiles) {
    const fullPath = path.join(root, ...file.split('/'));

    try {
      const content = await fs.readFile(fullPath, 'utf-8');

      const dir = path.posix.dirname(file);
      const depth = dir === '.' ? 0 : dir.split('/').length;

      if (dir === '.') {
        // Root AGENTS.md → always-applied GlobalPrompt
        items.push({
          id: createId(CustomizationType.GlobalPrompt, file),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: file,
          name: inferGlobalPromptName(file),
          content,
          metadata: { nested: false, depth },
        } as GlobalPrompt);
      } else {
        // Nested AGENTS.md → subtree-scoped FileRule
        items.push({
          id: createId(CustomizationType.FileRule, file),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          sourcePath: file,
          relativeDir: dir,
          content,
          globs: [`${dir}/**`],
          metadata: { nested: true, depth },
        } as FileRule);
      }
    } catch (error) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Could not read ${file}: ${(error as Error).message}`,
        sources: [file],
      });
    }
  }

  return { items, warnings };
}
