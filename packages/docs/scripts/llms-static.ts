/**
 * Local-serving helpers for docusaurus-plugin-llms artifacts.
 *
 * The upstream plugin only runs in postBuild, so `docusaurus start` never sees
 * llms.txt. These helpers generate into `static/` before start (creative Q3)
 * and clear those artifacts on docs:sync so prose regenerations cannot go stale.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  collectDocFiles,
  generateCustomLLMFiles,
  generateStandardLLMFiles,
} from 'docusaurus-plugin-llms/lib/generator.js';
import type { PluginContext } from 'docusaurus-plugin-llms/lib/types.js';
import { buildLlmsPluginOptions } from './llms-plugin-options.js';

/** Production site URL used for link construction in static LLM previews. */
export const DOCS_SITE_URL = 'https://texarkanine.github.io/a16n';

/**
 * Normalize a path to posix-style relative form for assertions and logging.
 */
function toPosixRelative(from: string, fullPath: string): string {
  return relative(from, fullPath).split(sep).join('/');
}

/**
 * List relative paths under `staticRoot` that are LLM preview artifacts
 * (root/nested llms*.txt and generated per-page .md mirrors).
 *
 * Leaves `versions.json` and `img/` alone.
 *
 * @param staticRoot - Absolute path to packages/docs/static
 */
export function listStaticLlmsArtifacts(staticRoot: string): string[] {
  if (!existsSync(staticRoot)) return [];

  const found: string[] = [];
  const stack = [staticRoot];

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

      const rel = toPosixRelative(staticRoot, full);

      // Preserve committed static assets
      if (rel === 'img' || rel.startsWith('img/')) {
        continue;
      }
      if (rel === 'versions.json') {
        continue;
      }

      if (isDir) {
        stack.push(full);
        continue;
      }

      if (
        name === 'llms.txt' ||
        name === 'llms-full.txt' ||
        name.endsWith('.md')
      ) {
        found.push(rel);
      }
    }
  }

  return found;
}

/**
 * Delete LLM preview artifacts under `staticRoot`.
 *
 * @param staticRoot - Absolute path to packages/docs/static
 * @returns Relative paths that were removed
 */
export function clearStaticLlmsArtifacts(staticRoot: string): string[] {
  const artifacts = listStaticLlmsArtifacts(staticRoot);
  for (const rel of artifacts) {
    rmSync(join(staticRoot, rel), { force: true });
  }
  return artifacts;
}

/**
 * Generate llms.txt / llms-full.txt (and custom per-version files) into `static/`
 * using the same plugin generators and options as production postBuild.
 *
 * @param docsDir - Absolute path to packages/docs
 */
export async function generateLlmsIntoStatic(docsDir: string): Promise<void> {
  const generatedRoot = join(docsDir, '.generated');
  const staticRoot = join(docsDir, 'static');

  if (!existsSync(generatedRoot)) {
    console.warn(
      'generateLlmsIntoStatic: .generated missing — skipping LLM static preview'
    );
    return;
  }

  mkdirSync(staticRoot, { recursive: true });
  clearStaticLlmsArtifacts(staticRoot);

  const options = buildLlmsPluginOptions(generatedRoot);
  const docsSections = [
    {
      path: options.docsDir,
      routeBasePath: options.docsDir,
    },
  ];

  const context: PluginContext = {
    siteDir: docsDir,
    outDir: staticRoot,
    siteUrl: DOCS_SITE_URL,
    docsDir: options.docsDir,
    docTitle: 'a16n Documentation',
    docDescription: 'AI agent configuration translation toolkit',
    docsSections,
    options: {
      generateLLMsTxt: options.generateLLMsTxt,
      generateLLMsFullTxt: options.generateLLMsFullTxt,
      docsDir: options.docsDir,
      generateMarkdownFiles: options.generateMarkdownFiles,
      customLLMFiles: options.customLLMFiles,
      includeUnmatchedLast: true,
      addMdExtension: true,
      preserveDirectoryStructure: true,
    },
  };

  const allDocFiles = await collectDocFiles(context);
  if (allDocFiles.length === 0) {
    console.warn(
      'generateLlmsIntoStatic: no documents found under .generated — skipping'
    );
    return;
  }

  await generateStandardLLMFiles(context, allDocFiles);
  await generateCustomLLMFiles(context, allDocFiles);
  console.log(
    `Generated LLM static preview (${allDocFiles.length} docs) → static/`
  );
}
