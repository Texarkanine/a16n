/**
 * Helpers for configuring docusaurus-plugin-llms against the docs `.generated` tree.
 *
 * Discovery scans versioned API/reference directories so per-version LLM files are
 * only registered when those trees exist (prose-only builds stay gated naturally).
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Shape of a docusaurus-plugin-llms customLLMFiles entry we emit. */
export interface LlmsCustomFile {
  filename: string;
  includePatterns: string[];
  fullContent: boolean;
  title?: string;
  description?: string;
  ignorePatterns?: string[];
}

/** Plugin options subset produced by {@link buildLlmsPluginOptions}. */
export interface LlmsPluginOptions {
  docsDir: string;
  generateLLMsTxt: boolean;
  generateLLMsFullTxt: boolean;
  generateMarkdownFiles: boolean;
  customLLMFiles: LlmsCustomFile[];
}

/** Ignore patterns that keep generated API/reference trees out of root llms-full.txt. */
const ROOT_FULL_IGNORE_PATTERNS = [
  '**/api/current/**',
  '**/api/[0-9]*/**',
  '**/reference/**',
];

/**
 * List immediate child directory names under `dir`.
 * @param dir - Absolute directory path
 * @returns Child directory basenames
 */
function listSubdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => {
    try {
      return statSync(join(dir, name)).isDirectory();
    } catch {
      return false;
    }
  });
}

/**
 * Whether a directory contains at least one `.md` file (non-recursive check of
 * immediate children plus one level of nesting is enough for TypeDoc trees;
 * we use a shallow walk of the version root).
 * @param dir - Absolute directory path
 */
function hasMarkdown(dir: string): boolean {
  if (!existsSync(dir)) return false;

  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    let entries: string[];
    try {
      entries = readdirSync(current);
    } catch {
      continue;
    }
    for (const name of entries) {
      const full = join(current, name);
      let isDir = false;
      try {
        isDir = statSync(full).isDirectory();
      } catch {
        continue;
      }
      if (isDir) {
        stack.push(full);
      } else if (name.endsWith('.md')) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Emit link + full customLLMFiles for a version-scoped docs subtree.
 * @param relativeVersionPath - Path relative to `.generated` (e.g. `engine/api/1.0.0`)
 */
function customFilesForVersion(relativeVersionPath: string): LlmsCustomFile[] {
  const includePatterns = [`${relativeVersionPath}/**/*.md`];
  const label = relativeVersionPath;
  return [
    {
      filename: `${relativeVersionPath}/llms.txt`,
      includePatterns,
      fullContent: false,
      title: `${label} API`,
      description: `LLM index for ${label}`,
    },
    {
      filename: `${relativeVersionPath}/llms-full.txt`,
      includePatterns,
      fullContent: true,
      title: `${label} API`,
      description: `Full LLM content for ${label}`,
    },
  ];
}

/**
 * Discover per-API-version customLLMFiles from a `.generated` root.
 *
 * Walks `<pkg>/api/<ver>` and `cli/reference/<ver>` directories. For each version
 * directory that contains markdown, emits nested `llms.txt` (links) and
 * `llms-full.txt` (full content) entries scoped to that tree.
 *
 * @param generatedRoot - Absolute path to the docs `.generated` directory
 * @returns customLLMFiles entries for discovered API/reference versions
 */
export function discoverApiLlmCustomFiles(generatedRoot: string): LlmsCustomFile[] {
  if (!existsSync(generatedRoot)) return [];

  const files: LlmsCustomFile[] = [];

  for (const pkgName of listSubdirs(generatedRoot)) {
    const apiDir = join(generatedRoot, pkgName, 'api');
    for (const version of listSubdirs(apiDir)) {
      const versionDir = join(apiDir, version);
      if (!hasMarkdown(versionDir)) continue;
      files.push(...customFilesForVersion(`${pkgName}/api/${version}`));
    }
  }

  const cliRefDir = join(generatedRoot, 'cli', 'reference');
  for (const version of listSubdirs(cliRefDir)) {
    const versionDir = join(cliRefDir, version);
    if (!hasMarkdown(versionDir)) continue;
    files.push(...customFilesForVersion(`cli/reference/${version}`));
  }

  return files;
}

/**
 * Build docusaurus-plugin-llms options for the a16n docs site.
 *
 * Root `llms.txt` indexes the whole site; root `llms-full.txt` is a custom
 * prose-only file (default full generator disabled). Discovered per-version
 * API LLM files are merged into `customLLMFiles`.
 *
 * @param generatedRoot - Absolute path to the docs `.generated` directory
 * @returns Plugin options object suitable for `['docusaurus-plugin-llms', options]`
 */
export function buildLlmsPluginOptions(generatedRoot: string): LlmsPluginOptions {
  const proseOnlyFull: LlmsCustomFile = {
    filename: 'llms-full.txt',
    includePatterns: ['**/*.md'],
    fullContent: true,
    title: 'a16n Documentation',
    description: 'Prose documentation for a16n (API reference trees excluded)',
    ignorePatterns: [...ROOT_FULL_IGNORE_PATTERNS],
  };

  return {
    docsDir: '.generated',
    generateLLMsTxt: true,
    generateLLMsFullTxt: false,
    generateMarkdownFiles: true,
    customLLMFiles: [proseOnlyFull, ...discoverApiLlmCustomFiles(generatedRoot)],
  };
}
