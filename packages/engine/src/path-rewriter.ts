import * as path from 'path';
import type { AgentCustomization, Warning } from '@a16njs/models';
import { WarningCode, isAgentSkillIO } from '@a16njs/models';
import type { WrittenFile } from '@a16njs/models';

/**
 * A mapping from source-relative paths to target-relative paths.
 * Used to rewrite path references in content during format conversion.
 */
export type PathMapping = Map<string, string>;

/**
 * Result of building a source-to-target path mapping.
 */
export interface BuildMappingResult {
  /** The computed path mapping */
  mapping: PathMapping;
  /** Warnings produced during mapping construction (e.g., ambiguous collisions) */
  warnings: Warning[];
}

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
 * Per the AgentSkills.io specification (§Optional directories), a skill
 * directory may contain ride-along files under a few conventional subtrees:
 *
 * - `scripts/` — executable code (shell, python, etc.); text by convention.
 * - `references/` — additional documentation (markdown); text by convention.
 * - `assets/` — templates, images, data files; may be binary or contain
 *   intentional placeholder strings that must NOT be rewritten.
 * - Any other directory — freeform, not guaranteed to be text.
 *
 * Content rewriting (and orphan scanning) of ride-along files is bounded to
 * the two spec-designated text subtrees (`scripts/` and `references/`) so we
 * do not corrupt binary/placeholder content in `assets/` or unknown subtrees.
 *
 * See https://agentskills.io/specification#optional-directories
 *
 * Kept private to this module; promote to `@a16njs/models` only if a second
 * caller appears.
 */
function isRewritableSkillResource(key: string): boolean {
  return key.startsWith('scripts/') || key.startsWith('references/');
}

/**
 * Build a mapping from source-relative paths to target-relative paths.
 *
 * Given the discovered items (with sourcePaths relative to sourceRoot)
 * and the written files (with absolute paths under targetRoot), produces
 * a Map where keys are source-relative paths and values are target-relative
 * paths, along with any warnings produced during construction.
 *
 * Per-WrittenFile source-path derivation:
 * - If `file.sourcePaths` is set and non-empty, those explicit paths are used
 *   (and `sourceItems[*].sourcePath` is NOT added as a mapping key for that
 *   file). This is the correct behaviour for outputs that represent source
 *   paths which are not first-class `AgentCustomization`s — e.g., AgentSkillIO
 *   resource files whose underlying `sourceItems` points at the skill's
 *   SKILL.md rather than at the resource file itself.
 * - Otherwise, falls back to `sourceItems[*].sourcePath` (legacy behaviour,
 *   used by every plugin that doesn't populate `sourcePaths`).
 *
 * Collision detection: if two WrittenFiles derive the same source-path key
 * but map to DIFFERENT target paths, an `Approximated` warning is emitted
 * and last-writer-wins for the mapping itself (historical behaviour).
 * Same-target duplicates are silently idempotent.
 *
 * @param _discovered - Items discovered from the source plugin (unused directly; mapping comes from written)
 * @param written - Files written (or planned) by the target plugin
 * @param _sourceRoot - Root directory used for discovery (unused; sourcePaths are already relative)
 * @param targetRoot - Root directory used for emission
 * @returns `{ mapping, warnings }` — source-to-target map and any collision warnings
 */
export function buildMapping(
  _discovered: AgentCustomization[],
  written: WrittenFile[],
  _sourceRoot: string,
  targetRoot: string,
): BuildMappingResult {
  const mapping: PathMapping = new Map();
  const warnings: Warning[] = [];

  for (const file of written) {
    // Compute target-relative path using POSIX separators for consistency
    const targetRelative = path.relative(targetRoot, file.path).split(path.sep).join('/');

    // Prefer explicit sourcePaths when populated; otherwise fall back to
    // sourceItems[*].sourcePath (legacy behaviour). Explicit sourcePaths
    // REPLACE the sourceItems-based derivation for this file (see JSDoc).
    //
    // Empty-string entries are filtered from BOTH branches: an empty mapping
    // key would hang `applyMapping`, since `indexOf('')` always returns 0 and
    // `idx += 0` never advances. The fallback branch has always filtered
    // falsy values; mirror that defence in the explicit branch since
    // `WrittenFile.sourcePaths` is part of `@a16njs/models`'s public API and
    // a third-party plugin could populate it with ''.
    let sourcePathCandidates: string[];
    if (file.sourcePaths && file.sourcePaths.length > 0) {
      sourcePathCandidates = file.sourcePaths.filter((p) => p.length > 0);
    } else if (file.sourceItems) {
      sourcePathCandidates = file.sourceItems
        .map((s) => s.sourcePath)
        .filter((p): p is string => Boolean(p));
    } else {
      sourcePathCandidates = [];
    }

    for (const rawSourcePath of sourcePathCandidates) {
      const normalized = rawSourcePath.split(path.sep).join('/');
      const existing = mapping.get(normalized);
      if (existing !== undefined && existing !== targetRelative) {
        warnings.push({
          code: WarningCode.Approximated,
          message:
            `Ambiguous path mapping: '${normalized}' maps to both ` +
            `'${existing}' and '${targetRelative}'. The plugin emitting ` +
            `these WrittenFiles should populate 'sourcePaths' explicitly ` +
            `to disambiguate.`,
          sources: [normalized],
        });
      }
      // Last-writer-wins for mapping (preserves historical behaviour)
      mapping.set(normalized, targetRelative);
    }
  }

  return { mapping, warnings };
}

/**
 * Apply a path mapping to a single string, returning the rewritten string
 * and the count of replacements made.
 *
 * `sortedEntries` must be pre-sorted longest-first to prevent partial-match
 * corruption (e.g., replacing "foo/bar.mdc.bak" before "foo/bar.mdc").
 */
function applyMapping(
  content: string,
  sortedEntries: Array<[string, string]>,
): { content: string; replaced: number } {
  let current = content;
  let replaced = 0;
  for (const [sourcePath, targetPath] of sortedEntries) {
    // Defence-in-depth against an empty key slipping past buildMapping:
    // `indexOf('')` returns 0 and `idx += 0` never advances, producing an
    // infinite loop. buildMapping filters empties at the boundary; this
    // second guard means `applyMapping` is safe against any caller that
    // constructs a mapping by hand.
    if (sourcePath.length === 0) continue;
    let count = 0;
    let idx = 0;
    while ((idx = current.indexOf(sourcePath, idx)) !== -1) {
      count++;
      idx += sourcePath.length;
    }
    if (count > 0) {
      current = current.split(sourcePath).join(targetPath);
      replaced += count;
    }
  }
  return { content: current, replaced };
}

/**
 * Rewrite file path references in item content.
 *
 * For each item, every occurrence of a mapped source path in the content
 * is replaced with the corresponding target path. Replacements are applied
 * longest-first to prevent partial match corruption (e.g., replacing
 * "foo/bar.mdc.bak" before "foo/bar.mdc").
 *
 * For `AgentSkillIO` items this ALSO rewrites content inside the `files` map
 * for entries whose key sits under a spec-designated text subtree (`scripts/`
 * or `references/`). Entries under `assets/` and any other subtree are NOT
 * rewritten (they may be binary or contain placeholder strings). See
 * `isRewritableSkillResource`.
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
    // Shallow clone — we only mutate content and files on the clone.
    const clone = { ...item };

    const bodyResult = applyMapping(clone.content, sortedEntries);
    clone.content = bodyResult.content;
    totalReplacements += bodyResult.replaced;

    // AgentSkillIO ride-along files under scripts/ and references/:
    // clone the files map so originals are never mutated, and rewrite
    // eligible entries.
    if (isAgentSkillIO(clone)) {
      const originalFiles = clone.files ?? {};
      const newFiles: Record<string, string> = {};
      for (const [key, value] of Object.entries(originalFiles)) {
        if (isRewritableSkillResource(key)) {
          const fileResult = applyMapping(value, sortedEntries);
          newFiles[key] = fileResult.content;
          totalReplacements += fileResult.replaced;
        } else {
          newFiles[key] = value;
        }
      }
      clone.files = newFiles;
    }

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
 * For `AgentSkillIO` items this ALSO scans ride-along files under the two
 * spec-designated text subtrees (`scripts/` and `references/`) using the same
 * rules. `assets/` and unknown subtrees are intentionally skipped — rewriting
 * their content is out of scope, so flagging orphans there would be a false
 * positive (a placeholder string in a template is not an "orphan", it's
 * intentional content). Skill-level attribution (via `item.sourcePath`) is
 * used for orphans found inside ride-along files; per-file attribution is
 * not currently plumbed.
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
  if (sourcePluginPrefixes.length === 0 || sourceExtensions.length === 0) {
    return [];
  }

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

  const scanString = (content: string, attributionSource: string | undefined): void => {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const foundPath = match[0];
      const key = `${attributionSource ?? ''}::${foundPath}`;
      if (!mappedPaths.has(foundPath) && !seen.has(key)) {
        seen.add(key);
        warnings.push({
          code: WarningCode.OrphanPathRef,
          message: `Orphan path reference: '${foundPath}' is not in the conversion set`,
          sources: attributionSource ? [attributionSource] : undefined,
        });
      }
    }
  };

  for (const item of items) {
    scanString(item.content, item.sourcePath);

    // AgentSkillIO ride-along files under scripts/ and references/:
    // scan content for orphans. Skill-level attribution via item.sourcePath;
    // per-file attribution is not plumbed today.
    if (isAgentSkillIO(item)) {
      const files = item.files ?? {};
      for (const [key, value] of Object.entries(files)) {
        if (isRewritableSkillResource(key)) {
          scanString(value, item.sourcePath);
        }
      }
    }
  }

  return warnings;
}
