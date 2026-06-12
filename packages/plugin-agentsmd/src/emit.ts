import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
  type Warning,
  type FileRule,
  type Workspace,
  WarningCode,
  isGlobalPrompt,
  isFileRule,
  resolveRoot,
} from '@a16njs/models';

/**
 * Matches a directory-shaped glob: `<dir>/**` or `<dir>/**\/*`.
 * Group 1 captures the directory part.
 */
const DIR_SHAPED_GLOB = /^(.+?)\/\*\*(\/\*)?$/;

/** Glob metacharacters that disqualify a captured directory part. */
const GLOB_METACHARS = /[*?[\]{}]/;

/**
 * Validate a POSIX-style relative directory and confirm it stays inside root.
 * Returns the normalized relative dir ('' for root), or null when the input
 * is absolute, contains empty/'..' segments, or escapes the root.
 */
function resolveSafeDir(root: string, dir: string): string | null {
  if (!dir || dir === '.') return '';
  if (dir.startsWith('/') || /^[A-Za-z]:/.test(dir)) return null;

  const segments = dir.split('/');
  if (segments.some(s => s === '' || s === '.' || s === '..')) return null;

  const resolved = path.resolve(root, ...segments);
  const resolvedRoot = path.resolve(root);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    return null;
  }
  return segments.join('/');
}

/**
 * Extract the target directory for a FileRule, when its globs are exactly one
 * directory-shaped pattern with a clean (metacharacter-free) directory part.
 * Returns the POSIX relative dir, or null when the rule cannot be represented
 * as a directory-scoped AGENTS.md.
 */
function fileRuleTargetDir(root: string, rule: FileRule): string | null {
  if (rule.globs.length !== 1) return null;

  const glob = rule.globs[0]!.replace(/^\.\//, '');
  const match = DIR_SHAPED_GLOB.exec(glob);
  if (!match) return null;

  const dir = match[1]!;
  if (GLOB_METACHARS.test(dir)) return null;

  return resolveSafeDir(root, dir);
}

/**
 * Emit agent customizations as AGENTS.md files.
 *
 * Placement:
 * - GlobalPrompt → root `AGENTS.md`. `relativeDir` is deliberately ignored:
 *   it describes file organization inside a rules directory, not scoping —
 *   an always-applied prompt's only faithful AGENTS.md location is the root.
 * - GlobalPrompt with `metadata.nested === true` and a `sourcePath` (nested
 *   CLAUDE.md discovered by the claude plugin) → `dirname(sourcePath)/AGENTS.md`,
 *   preserving the directory scoping those files carry. Falls back to the
 *   root when the source directory is unusable (always-applied content is
 *   never dropped).
 * - FileRule whose globs are a single directory-shaped pattern (`<dir>/**`
 *   or `<dir>/**\/*`) → `<dir>/AGENTS.md`. Other FileRules cannot be
 *   represented in AGENTS.md and are skipped with a warning.
 * - All other types are returned in `unsupported`.
 *
 * Write semantics: deterministic overwrite — output is a pure function of
 * the input items, so repeated emission is idempotent. Multiple items
 * targeting the same file are concatenated (`\n\n` joined, input order) with
 * a `Merged` warning. Replacing a pre-existing file whose content differs
 * produces an `Overwritten` warning; byte-identical re-writes stay silent.
 *
 * @param models - The customizations to emit
 * @param rootOrWorkspace - Root directory path or Workspace instance to write to
 * @param options - Optional emit options (e.g., dryRun)
 * @returns Info about what was written (or would be written) and any issues
 */
export async function emit(
  models: AgentCustomization[],
  rootOrWorkspace: string | Workspace,
  options?: EmitOptions
): Promise<EmitResult> {
  const root = resolveRoot(rootOrWorkspace);
  const dryRun = options?.dryRun ?? false;
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];

  // Bucket items by target directory ('' = repo root), preserving input order.
  const buckets = new Map<string, AgentCustomization[]>();
  const addToBucket = (dir: string, item: AgentCustomization): void => {
    const bucket = buckets.get(dir);
    if (bucket) {
      bucket.push(item);
    } else {
      buckets.set(dir, [item]);
    }
  };

  for (const model of models) {
    if (isGlobalPrompt(model)) {
      let dir = '';
      if (model.metadata?.nested === true && model.sourcePath) {
        const sourceDir = path.posix.dirname(model.sourcePath.split(path.sep).join('/'));
        dir = resolveSafeDir(root, sourceDir) ?? '';
      }
      addToBucket(dir, model);
    } else if (isFileRule(model)) {
      const dir = fileRuleTargetDir(root, model);
      if (dir === null || dir === '') {
        // '' means the glob resolved to the root itself, which a dir-scoped
        // rule cannot legitimately do — treat it like any other unrepresentable glob.
        warnings.push({
          code: WarningCode.Skipped,
          message: `FileRule skipped: globs cannot be represented as a directory-scoped AGENTS.md (${model.globs.join(', ')})`,
          sources: model.sourcePath ? [model.sourcePath] : [],
        });
        continue;
      }
      addToBucket(dir, model);
    } else {
      unsupported.push(model);
    }
  }

  // Deterministic output order: root first, then directories sorted.
  const dirs = [...buckets.keys()].sort((a, b) =>
    a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)
  );

  for (const dir of dirs) {
    const items = buckets.get(dir)!;
    const targetDir = dir ? path.join(root, ...dir.split('/')) : root;
    const targetPath = path.join(targetDir, 'AGENTS.md');
    const relPath = dir ? `${dir}/AGENTS.md` : 'AGENTS.md';
    const sources = items
      .map(i => i.sourcePath)
      .filter((s): s is string => s !== undefined);

    const content =
      items.map(i => i.content.trim()).join('\n\n') + '\n';

    let existing: string | null = null;
    try {
      existing = await fs.readFile(targetPath, 'utf-8');
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        existing = null;
      } else {
        throw error;
      }
    }
    const isNewFile = existing === null;

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(targetPath, content, 'utf-8');
    }

    written.push({
      path: targetPath,
      type: items[0]!.type,
      itemCount: items.length,
      isNewFile,
      sourceItems: items,
    });

    if (items.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${items.length} items into ${relPath}`,
        sources,
      });
    }

    if (!isNewFile && existing !== content) {
      warnings.push({
        code: WarningCode.Overwritten,
        message: `Replaced existing ${relPath}`,
        sources,
      });
    }
  }

  return { written, warnings, unsupported };
}
