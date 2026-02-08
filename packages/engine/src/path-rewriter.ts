import * as path from 'path';
import type { AgentCustomization, Warning } from '@a16njs/models';
import { WarningCode } from '@a16njs/models';
import type { WrittenFile } from '@a16njs/models';

/**
 * A mapping from source-relative paths to target-relative paths.
 * Used to rewrite path references in content during format conversion.
 */
export type PathMapping = Map<string, string>;

/**
 * Result of a path rewriting operation.
 */
export interface RewriteResult {
  /** The items with rewritten content (cloned; originals are not mutated) */
  items: AgentCustomization[];
  /** Count of replacements made across all items */
  replacementCount: number;
}

/**
 * Build a mapping from source-relative paths to target-relative paths.
 *
 * Given the discovered items (with sourcePaths relative to sourceRoot)
 * and the written files (with absolute paths under targetRoot), produces
 * a Map where keys are source-relative paths and values are target-relative paths.
 *
 * The mapping is derived from the `sourceItems` array on each WrittenFile,
 * which links each output file back to the source AgentCustomization(s) that
 * produced it. This handles merges, extension changes, and directory flattening
 * naturally because the mapping is derived from actual emit output.
 *
 * @param _discovered - Items discovered from the source plugin (unused directly; mapping comes from written.sourceItems)
 * @param written - Files written (or planned) by the target plugin
 * @param _sourceRoot - Root directory used for discovery (unused; sourcePaths are already relative)
 * @param targetRoot - Root directory used for emission
 * @returns A map of source-relative path to target-relative path
 */
export function buildMapping(
  _discovered: AgentCustomization[],
  written: WrittenFile[],
  _sourceRoot: string,
  targetRoot: string,
): PathMapping {
  const mapping: PathMapping = new Map();

  for (const file of written) {
    // Compute target-relative path using POSIX separators for consistency
    const targetRelative = path.relative(targetRoot, file.path).split(path.sep).join('/');

    // Map each source item's sourcePath to this target path
    if (file.sourceItems) {
      for (const sourceItem of file.sourceItems) {
        if (sourceItem.sourcePath) {
          // Normalize to POSIX separators
          const normalizedSourcePath = sourceItem.sourcePath.split(path.sep).join('/');
          mapping.set(normalizedSourcePath, targetRelative);
        }
      }
    }
  }

  return mapping;
}

/**
 * Rewrite file path references in item content.
 *
 * For each item, every occurrence of a mapped source path in the content
 * is replaced with the corresponding target path. Replacements are applied
 * longest-first to prevent partial match corruption (e.g., replacing
 * "foo/bar.mdc.bak" before "foo/bar.mdc").
 *
 * Items are cloned before modification; originals are not mutated.
 *
 * @param items - The items whose content should be rewritten
 * @param mapping - The source-to-target path mapping
 * @returns Cloned items with rewritten content and replacement count
 */
export function rewriteContent(
  items: AgentCustomization[],
  mapping: PathMapping,
): RewriteResult {
  if (mapping.size === 0) {
    // No mapping → return clones with no changes
    return {
      items: items.map((item) => ({ ...item })),
      replacementCount: 0,
    };
  }

  // Sort replacements longest-first to prevent partial match corruption
  const sortedEntries = Array.from(mapping.entries()).sort(
    (a, b) => b[0].length - a[0].length,
  );

  let totalReplacements = 0;

  const rewrittenItems = items.map((item) => {
    // Clone the item (shallow clone is sufficient since we only modify content)
    const clone = { ...item };
    let content = clone.content;

    // NOTE: Replacements are applied sequentially. This is safe because source
    // and target paths use different plugin directory prefixes, so a target path
    // won't match a subsequent source key.
    for (const [sourcePath, targetPath] of sortedEntries) {
      // Count occurrences before replacement
      let count = 0;
      let idx = 0;
      while ((idx = content.indexOf(sourcePath, idx)) !== -1) {
        count++;
        idx += sourcePath.length;
      }

      if (count > 0) {
        // Use split+join for exact string replacement (no regex escaping needed)
        content = content.split(sourcePath).join(targetPath);
        totalReplacements += count;
      }
    }

    clone.content = content;
    return clone;
  });

  return {
    items: rewrittenItems,
    replacementCount: totalReplacements,
  };
}

/**
 * Escape a string for use in a RegExp.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detect orphan path references in item content.
 *
 * An "orphan" is a string in content that looks like it could be a
 * source-format file path (matches known source plugin path prefixes
 * and file extensions) but is NOT present in the mapping (i.e., it
 * wasn't converted).
 *
 * @param items - The items to scan for orphan references
 * @param mapping - The source-to-target path mapping
 * @param sourcePluginPrefixes - Known directory prefixes for the source format
 *   (e.g., ['.cursor/rules/', '.cursor/skills/'] for cursor plugin)
 * @param sourceExtensions - Known file extensions for the source format
 *   (e.g., ['.mdc', '.md'] for cursor plugin)
 * @returns Warnings about orphan references found
 */
export function detectOrphans(
  items: AgentCustomization[],
  mapping: PathMapping,
  sourcePluginPrefixes: string[],
  sourceExtensions: string[],
): Warning[] {
  const warnings: Warning[] = [];
  const mappedPaths = new Set(mapping.keys());
  const seen = new Set<string>();

  // Build a regex that matches: <prefix><non-whitespace-path><extension>
  // e.g., .cursor/rules/some-file.mdc
  const escapedPrefixes = sourcePluginPrefixes.map(escapeRegExp).join('|');
  const escapedExtensions = sourceExtensions.map(escapeRegExp).join('|');
  const pattern = new RegExp(
    `(?:${escapedPrefixes})[^\\s)\\]}>,"']+(?:${escapedExtensions})`,
    'g',
  );

  for (const item of items) {
    const matches = item.content.matchAll(pattern);
    for (const match of matches) {
      const foundPath = match[0];
      const key = `${item.sourcePath ?? ''}::${foundPath}`;
      if (!mappedPaths.has(foundPath) && !seen.has(key)) {
        seen.add(key);
        warnings.push({
          code: WarningCode.OrphanPathRef,
          message: `Orphan path reference: '${foundPath}' is not in the conversion set`,
          sources: item.sourcePath ? [item.sourcePath] : undefined,
        });
      }
    }
  }

  return warnings;
}
