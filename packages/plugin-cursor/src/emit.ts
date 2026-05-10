import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
  type Warning,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type Workspace,
  CustomizationType,
  WarningCode,
  isGlobalPrompt,
  isFileRule,
  isSimpleAgentSkill,
  isAgentSkillIO,
  isAgentIgnore,
  isManualPrompt,
  type ManualPrompt,
  resolveRoot,
} from '@a16njs/models';

/**
 * Sanitize a source file path to a safe *rule filename* stem, preserving
 * source case. Extracts basename, strips the last extension, normalizes
 * non-alphanumerics to hyphens, and trims leading/trailing hyphens. Returns
 * 'rule' when the result would be empty.
 *
 * Case is preserved because `.cursor/rules/**` filenames carry no spec
 * requirement on case — lowercasing would be an a16n-imposed convention, not
 * a target-format requirement (see task 20260421-preserve-filename-case).
 * Skill directory names still use `sanitizePromptName`, which lowercases per
 * the AgentSkills.io spec (Cursor implements that spec; skill dir name must
 * match `[a-z0-9-]+`).
 */
function sanitizeFilename(sourcePath: string): string {
  // Get just the filename without directory
  const basename = path.basename(sourcePath);

  // Remove extension
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');

  // Replace unsafe characters; preserve case
  const sanitized = nameWithoutExt
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens

  // Return fallback if empty
  return sanitized || 'rule';
}

/**
 * Sanitize a prompt name to prevent path traversal and ensure filesystem safety.
 * Returns a safe string with only alphanumeric characters and hyphens.
 */
function sanitizePromptName(promptName: string): string {
  // Remove any path separators and normalize
  const sanitized = promptName
    .toLowerCase()
    .replace(/[/\\]/g, '-')  // Replace path separators with hyphens
    .replace(/[^a-z0-9]+/g, '-')  // Replace other unsafe chars with hyphens
    .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
  return sanitized || 'command';
}

/**
 * Generate a unique filename by appending a counter if needed.
 * Returns the unique filename and whether a collision occurred.
 *
 * Case-insensitive: treats case-only differences as collisions so that a
 * case-insensitive filesystem (macOS, Windows) cannot silently overwrite one
 * rule file with another whose stem differs only in case. The returned
 * filename preserves the ORIGINAL-case `baseName`; only the Set key is
 * lowercased. Kept plugin-local because case policy is plugin-internal
 * business (see task 20260421-preserve-filename-case).
 */
function getUniqueFilename(
  baseName: string,
  usedNames: Set<string>
): { filename: string; collision: boolean } {
  if (!usedNames.has(baseName.toLowerCase())) {
    usedNames.add(baseName.toLowerCase());
    return { filename: baseName, collision: false };
  }

  // Collision detected - find unique name
  let counter = 2;
  let uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  while (usedNames.has(uniqueName.toLowerCase())) {
    counter++;
    uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  }
  usedNames.add(uniqueName.toLowerCase());
  return { filename: uniqueName, collision: true };
}

/**
 * Format content as MDC with GlobalPrompt frontmatter.
 */
function formatGlobalPromptMdc(content: string): string {
  return `---
alwaysApply: true
---

${content}
`;
}

/**
 * Format content as MDC with FileRule frontmatter (globs).
 */
function formatFileRuleMdc(content: string, globs: string[]): string {
  const globsLine = globs.join(',');
  return `---
globs: ${globsLine}
---

${content}
`;
}

/**
 * Format content as MDC with SimpleAgentSkill frontmatter (description).
 * Used for legacy .cursor/rules/*.mdc emission.
 */
function formatAgentSkillMdc(content: string, description: string): string {
  // Quote description if it contains special YAML characters
  const needsQuotes = /[:&*#?|\-<>=!%@`]/.test(description);
  const quotedDesc = needsQuotes ? `"${description.replace(/"/g, '\\"')}"` : description;
  return `---
description: ${quotedDesc}
---

${content}
`;
}

/**
 * Format SimpleAgentSkill as a SKILL.md file.
 * Used for .cursor/skills/ emission (Phase 7).
 */
function formatAgentSkillMd(skill: import('@a16njs/models').SimpleAgentSkill): string {
  // skill.name is the canonical invocation name; metadata.name may carry original display name from source
  const safeName = JSON.stringify(skill.name);
  const safeDescription = JSON.stringify(skill.description);

  return `---
name: ${safeName}
description: ${safeDescription}
---

${skill.content}
`;
}

/**
 * Format a ManualPrompt as a Cursor Agent Skill (disable-model-invocation).
 *
 * Emits to .cursor/skills/<sanitized-promptName>/SKILL.md with YAML frontmatter
 * including name, description ("Invoke with /<name>"), and disable-model-invocation: true.
 * Matches the Claude Code reference implementation for consistency.
 *
 * @param prompt - The ManualPrompt to format
 * @returns Formatted SKILL.md content with frontmatter
 */
function formatManualPromptAsSkill(prompt: ManualPrompt): string {
  const safeName = JSON.stringify(prompt.promptName);
  const description = `Invoke with /${prompt.promptName}`;
  const safeDescription = JSON.stringify(description);

  return `---
name: ${safeName}
description: ${safeDescription}
disable-model-invocation: true
---

${prompt.content}
`;
}

/**
 * Emit an AgentSkillIO to Cursor format.
 * Smart routing based on skill complexity:
 * - Simple (no resources, no files) → emit as rule or ManualPrompt
 * - Complex (has resources or files) → emit full skill directory
 *
 * @param skill - The AgentSkillIO to emit
 * @param root - Root directory to write to
 * @param dryRun - If true, don't write files
 * @param warnings - Array to append warnings to
 * @param usedSkillNames - Set of used skill directory names (for collision detection)
 * @param usedFilenames - Set of used rule filenames (for collision detection with GlobalPrompt/FileRule)
 * @param collisionSources - Array to collect collision source paths
 * @returns Array of written files
 */
async function emitAgentSkillIO(
  skill: AgentSkillIO,
  root: string,
  dryRun: boolean,
  warnings: Warning[],
  usedSkillNames: Set<string>,
  usedFilenames: Set<string>,
  collisionSources: string[]
): Promise<WrittenFile[]> {
  const written: WrittenFile[] = [];

  // Check if skill is effectively simple (no resources, no files)
  const files = skill.files ?? {};
  const isSimple = (!skill.resources || skill.resources.length === 0) &&
                   Object.keys(files).length === 0;

  if (isSimple) {
    // Simple AgentSkillIO → emit idiomatically
    if (skill.disableModelInvocation) {
      // Emit as ManualPrompt skill (.cursor/skills/<name>/SKILL.md with disable flag)
      const baseName = sanitizePromptName(skill.name);
      let dirName = baseName;
      if (usedSkillNames.has(dirName)) {
        if (skill.sourcePath) collisionSources.push(skill.sourcePath);
        let counter = 1;
        while (usedSkillNames.has(`${baseName}-${counter}`)) {
          counter++;
        }
        dirName = `${baseName}-${counter}`;
      }
      usedSkillNames.add(dirName);

      const skillDir = path.join(root, '.cursor', 'skills', dirName);
      if (!dryRun) {
        await fs.mkdir(skillDir, { recursive: true });
      }

      const filepath = path.join(skillDir, 'SKILL.md');
      const safeName = JSON.stringify(skill.name);
      const safeDescription = JSON.stringify(skill.description);
      const content = `---
name: ${safeName}
description: ${safeDescription}
disable-model-invocation: true
---

${skill.content}
`;

      let isNewFile = true;
      try {
        await fs.access(filepath);
        isNewFile = false;
      } catch {
        isNewFile = true;
      }

      if (!dryRun) {
        await fs.writeFile(filepath, content, 'utf-8');
      }

      written.push({
        path: filepath,
        type: CustomizationType.AgentSkillIO,
        itemCount: 1,
        isNewFile,
        sourceItems: [skill],
      });
    } else {
      // Emit as Cursor rule (.cursor/rules/<name>.mdc with description:)
      const rulesDir = path.join(root, '.cursor', 'rules');
      if (!dryRun) {
        await fs.mkdir(rulesDir, { recursive: true });
      }

      const baseName = sanitizeFilename(skill.name) + '.mdc';
      const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
      if (collision) {
        if (skill.sourcePath) collisionSources.push(skill.sourcePath);
      }

      const filepath = path.join(rulesDir, filename);
      const content = formatAgentSkillMdc(skill.content, skill.description);

      let isNewFile = true;
      try {
        await fs.access(filepath);
        isNewFile = false;
      } catch {
        isNewFile = true;
      }

      if (!dryRun) {
        await fs.writeFile(filepath, content, 'utf-8');
      }

      written.push({
        path: filepath,
        type: CustomizationType.AgentSkillIO,
        itemCount: 1,
        isNewFile,
        sourceItems: [skill],
      });
    }
  } else {
    // Complex AgentSkillIO → emit full directory with all files
    const baseName = sanitizePromptName(skill.name);
    let dirName = baseName;
    if (usedSkillNames.has(dirName)) {
      if (skill.sourcePath) collisionSources.push(skill.sourcePath);
      let counter = 1;
      while (usedSkillNames.has(`${baseName}-${counter}`)) {
        counter++;
      }
      dirName = `${baseName}-${counter}`;
    }
    usedSkillNames.add(dirName);

    const skillDir = path.join(root, '.cursor', 'skills', dirName);
    if (!dryRun) {
      await fs.mkdir(skillDir, { recursive: true });
    }

    // Write SKILL.md with full frontmatter
    const skillPath = path.join(skillDir, 'SKILL.md');
    const safeName = JSON.stringify(skill.name);
    const safeDescription = JSON.stringify(skill.description);
    
    let frontmatter = `---
name: ${safeName}
description: ${safeDescription}`;

    if (skill.disableModelInvocation) {
      frontmatter += '\ndisable-model-invocation: true';
    }

    frontmatter += '\n---';

    const skillContent = `${frontmatter}\n\n${skill.content}\n`;

    let isNewFile = true;
    try {
      await fs.access(skillPath);
      isNewFile = false;
    } catch {
      isNewFile = true;
    }

    if (!dryRun) {
      await fs.writeFile(skillPath, skillContent, 'utf-8');
    }

    written.push({
      path: skillPath,
      type: CustomizationType.AgentSkillIO,
      itemCount: 1,
      isNewFile,
      sourceItems: [skill],
    });

    // Write all resource files
    const baseDir = path.resolve(skillDir);
    for (const [filename, content] of Object.entries(skill.files ?? {})) {
      // Validate filename to prevent path traversal
      if (path.isAbsolute(filename) || filename.includes('..')) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped resource with unsafe path: ${filename}`,
          sources: skill.sourcePath ? [skill.sourcePath] : [],
        });
        continue;
      }

      const resolvedPath = path.resolve(skillDir, filename);
      if (!resolvedPath.startsWith(baseDir + path.sep) && resolvedPath !== baseDir) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped resource outside skill directory: ${filename}`,
          sources: skill.sourcePath ? [skill.sourcePath] : [],
        });
        continue;
      }

      // Ensure parent directory exists for nested paths
      const parentDir = path.dirname(resolvedPath);
      if (!dryRun && parentDir !== skillDir) {
        await fs.mkdir(parentDir, { recursive: true });
      }

      let isResourceNewFile = true;
      try {
        await fs.access(resolvedPath);
        isResourceNewFile = false;
      } catch {
        isResourceNewFile = true;
      }

      if (!dryRun) {
        await fs.writeFile(resolvedPath, content, 'utf-8');
      }

      // Compute explicit source-relative path for this resource so
      // path-rewriter.buildMapping can key it correctly. Without this the
      // mapping would (a) miss source→target entries for resource files and
      // (b) clobber the SKILL.md→SKILL.md entry because every resource's
      // sourceItems[0].sourcePath points at the skill's SKILL.md.
      // POSIX separators per the buildMapping contract.
      const resourceSourcePath = skill.sourcePath
        ? path.posix.join(
            path.posix.dirname(skill.sourcePath.split(path.sep).join('/')),
            filename.split(path.sep).join('/'),
          )
        : undefined;

      written.push({
        path: resolvedPath,
        type: CustomizationType.AgentSkillIO,
        itemCount: 1,
        isNewFile: isResourceNewFile,
        sourceItems: [skill],
        ...(resourceSourcePath !== undefined && { sourcePaths: [resourceSourcePath] }),
      });
    }
  }

  return written;
}

/**
 * Emit agent customizations to Cursor format.
 * - GlobalPrompt → .mdc with alwaysApply: true
 * - FileRule → .mdc with globs:
 * - AgentSkill → .mdc with description:
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
  const usedFilenames = new Set<string>();

  // Separate by type
  const globalPrompts = models.filter(isGlobalPrompt);
  const fileRules = models.filter(isFileRule);
  const agentSkills = models.filter(isSimpleAgentSkill);
  const agentSkillIOs = models.filter(isAgentSkillIO);
  const agentIgnores = models.filter(isAgentIgnore);
  const manualPrompts = models.filter(isManualPrompt);
  
  // Track unsupported types (future types)
  for (const model of models) {
    if (!isGlobalPrompt(model) && !isFileRule(model) && !isSimpleAgentSkill(model) && !isAgentSkillIO(model) && !isAgentIgnore(model) && !isManualPrompt(model)) {
      unsupported.push(model);
    }
  }

  // Items that go to .cursor/rules/*.mdc
  const mdcItems = [...globalPrompts, ...fileRules];
  // Items that go to .cursor/skills/*/SKILL.md (Phase 7)
  const skillItems = [...agentSkills];
  
  // Early return only if no items at all (including agentIgnores, agentSkillIOs, and manualPrompts)
  if (mdcItems.length === 0 && skillItems.length === 0 && agentSkillIOs.length === 0 && agentIgnores.length === 0 && manualPrompts.length === 0) {
    return { written, warnings, unsupported };
  }

  // Track sources that had collisions for warning
  const collisionSources: string[] = [];
  
  // Ensure .cursor/rules directory exists (only if we have mdc items, skip in dry-run)
  const rulesDir = path.join(root, '.cursor', 'rules');
  if (mdcItems.length > 0 && !dryRun) {
    await fs.mkdir(rulesDir, { recursive: true });
  }

  // Track used skill names for .cursor/skills/ collision detection
  const usedSkillNames = new Set<string>();

  // Emit each GlobalPrompt as a separate .mdc file
  for (const gp of globalPrompts) {
    // gp.name is already a clean stem; apply dot-to-hyphen normalization
    // without extension stripping (sanitizeFilename would double-strip).
    // Case preserved (see task 20260421-preserve-filename-case).
    const stem = gp.name.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'rule';
    const baseName = stem + '.mdc';

    // Resolve target directory and validate before collision detection
    const targetDir = gp.relativeDir
      ? path.join(rulesDir, gp.relativeDir)
      : rulesDir;
    const resolvedTarget = path.resolve(targetDir);
    const resolvedRules = path.resolve(rulesDir);
    if (gp.relativeDir && resolvedTarget !== resolvedRules && !resolvedTarget.startsWith(resolvedRules + path.sep)) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped rule with unsafe relativeDir: ${gp.relativeDir}`,
        sources: gp.sourcePath ? [gp.sourcePath] : [],
      });
      continue;
    }

    // Normalize relativeDir via resolved paths so equivalent forms
    // (e.g. "shared/niko" vs "shared/niko/") produce identical collision keys
    const normalizedDir = gp.relativeDir
      ? path.relative(resolvedRules, resolvedTarget)
      : undefined;
    const qualifiedName = normalizedDir ? `${normalizedDir}/${baseName}` : baseName;
    const { filename: qualifiedFilename, collision } = getUniqueFilename(qualifiedName, usedFilenames);
    const filename = normalizedDir ? path.basename(qualifiedFilename) : qualifiedFilename;

    if (collision) {
      if (gp.sourcePath) collisionSources.push(gp.sourcePath);
    }

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }
    const filepath = path.join(targetDir, filename);
    const content = formatGlobalPromptMdc(gp.content);

    // Check if file exists before writing
    let isNewFile = true;
    try {
      await fs.access(filepath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }

    if (!dryRun) {
      await fs.writeFile(filepath, content, 'utf-8');
    }

    written.push({
      path: filepath,
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
      isNewFile,
      sourceItems: [gp],
    });
  }

  // Emit each FileRule as a separate .mdc file with globs
  for (const fr of fileRules) {
    const baseName = sanitizeFilename(fr.sourcePath || fr.id) + '.mdc';

    // Resolve target directory and validate before collision detection
    const targetDir = fr.relativeDir
      ? path.join(rulesDir, fr.relativeDir)
      : rulesDir;
    const resolvedTarget = path.resolve(targetDir);
    const resolvedRules = path.resolve(rulesDir);
    if (fr.relativeDir && resolvedTarget !== resolvedRules && !resolvedTarget.startsWith(resolvedRules + path.sep)) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped rule with unsafe relativeDir: ${fr.relativeDir}`,
        sources: fr.sourcePath ? [fr.sourcePath] : [],
      });
      continue;
    }

    const normalizedDir = fr.relativeDir
      ? path.relative(resolvedRules, resolvedTarget)
      : undefined;
    const qualifiedName = normalizedDir ? `${normalizedDir}/${baseName}` : baseName;
    const { filename: qualifiedFilename, collision } = getUniqueFilename(qualifiedName, usedFilenames);
    const filename = normalizedDir ? path.basename(qualifiedFilename) : qualifiedFilename;

    if (collision) {
      if (fr.sourcePath) collisionSources.push(fr.sourcePath);
    }

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }
    const filepath = path.join(targetDir, filename);
    const content = formatFileRuleMdc(fr.content, fr.globs);

    // Check if file exists before writing
    let isNewFile = true;
    try {
      await fs.access(filepath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }

    if (!dryRun) {
      await fs.writeFile(filepath, content, 'utf-8');
    }

    written.push({
      path: filepath,
      type: CustomizationType.FileRule,
      itemCount: 1,
      isNewFile,
      sourceItems: [fr],
    });
  }

  // === Emit SimpleAgentSkills as .cursor/skills/*/SKILL.md (Phase 7) ===
  for (const skill of agentSkills) {
    // Use the invocation name (skill.name) when available; fall back to metadata.name then sourcePath
    const skillName = skill.name
      || (skill.metadata?.name as string)
      || sanitizeFilename(skill.sourcePath || skill.id);
    const baseName = sanitizePromptName(skillName);
    
    // Get unique name to avoid collisions
    let dirName = baseName;
    if (usedSkillNames.has(dirName)) {
      if (skill.sourcePath) collisionSources.push(skill.sourcePath);
      let counter = 1;
      while (usedSkillNames.has(`${baseName}-${counter}`)) {
        counter++;
      }
      dirName = `${baseName}-${counter}`;
    }
    usedSkillNames.add(dirName);

    const skillDir = path.join(root, '.cursor', 'skills', dirName);
    if (!dryRun) {
      await fs.mkdir(skillDir, { recursive: true });
    }

    const filepath = path.join(skillDir, 'SKILL.md');
    const content = formatAgentSkillMd(skill);

    // Check if file exists before writing
    let isNewFile = true;
    try {
      await fs.access(filepath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }

    if (!dryRun) {
      await fs.writeFile(filepath, content, 'utf-8');
    }

    written.push({
      path: filepath,
      type: CustomizationType.SimpleAgentSkill,
      itemCount: 1,
      isNewFile,
      sourceItems: [skill],
    });
  }

  // === Emit AgentIgnores as .cursorignore ===
  if (agentIgnores.length > 0) {
    const allPatterns = agentIgnores.flatMap(ai => ai.patterns);
    const uniquePatterns = [...new Set(allPatterns)];
    const filepath = path.join(root, '.cursorignore');
    
    // Check if file exists before writing
    let isNewFile = true;
    try {
      await fs.access(filepath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }
    
    if (!dryRun) {
      await fs.writeFile(filepath, uniquePatterns.join('\n') + '\n', 'utf-8');
    }

    written.push({
      path: filepath,
      type: CustomizationType.AgentIgnore,
      itemCount: agentIgnores.length,
      isNewFile,
      sourceItems: agentIgnores,
    });

    if (agentIgnores.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${agentIgnores.length} ignore sources into .cursorignore`,
        sources: agentIgnores.map(ai => ai.sourcePath).filter((s): s is string => s !== undefined),
      });
    }
  }

  // === Emit ManualPrompts as .cursor/skills/<name>/SKILL.md (disable-model-invocation) ===
  // Commands are discovered for legacy support but do not round-trip.
  // Emitted form is now a disable-model-invocation Agent Skill (see discover.ts).
  const usedSkillNamesForManual = usedSkillNames; // reuse existing set for unified collision across skills
  for (const prompt of manualPrompts) {
    const baseName = sanitizePromptName(prompt.promptName);

    let dirName = baseName;
    if (usedSkillNamesForManual.has(dirName)) {
      if (prompt.sourcePath) collisionSources.push(prompt.sourcePath);
      let counter = 1;
      while (usedSkillNamesForManual.has(`${baseName}-${counter}`)) {
        counter++;
      }
      dirName = `${baseName}-${counter}`;
    }
    usedSkillNamesForManual.add(dirName);

    const skillsRoot = path.join(root, '.cursor', 'skills');
    const targetDir = prompt.relativeDir
      ? path.join(skillsRoot, prompt.relativeDir, dirName)
      : path.join(skillsRoot, dirName);
    const resolvedTarget = path.resolve(targetDir);
    const resolvedSkillsRoot = path.resolve(skillsRoot);
    if (prompt.relativeDir && resolvedTarget !== resolvedSkillsRoot && !resolvedTarget.startsWith(resolvedSkillsRoot + path.sep)) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped ManualPrompt with unsafe relativeDir: ${prompt.relativeDir}`,
        sources: prompt.sourcePath ? [prompt.sourcePath] : [],
      });
      continue;
    }

    if (!dryRun) {
      await fs.mkdir(targetDir, { recursive: true });
    }

    const filepath = path.join(targetDir, 'SKILL.md');
    const content = formatManualPromptAsSkill(prompt);

    let isNewFile = true;
    try {
      await fs.access(filepath);
      isNewFile = false;
    } catch {
      isNewFile = true;
    }

    if (!dryRun) {
      await fs.writeFile(filepath, content, 'utf-8');
    }

    written.push({
      path: filepath,
      type: CustomizationType.ManualPrompt,
      itemCount: 1,
      isNewFile,
      sourceItems: [prompt],
    });
  }

  // === Emit AgentSkillIOs (Phase 8 B4) ===
  for (const skillIO of agentSkillIOs) {
    const skillIOWritten = await emitAgentSkillIO(skillIO, root, dryRun, warnings, usedSkillNames, usedFilenames, collisionSources);
    written.push(...skillIOWritten);
  }

  // Emit warning if any collisions occurred (after all emitters complete)
  if (collisionSources.length > 0) {
    warnings.push({
      code: WarningCode.FileRenamed,
      message: `Filename collision: ${collisionSources.length} file(s) renamed to avoid overwrite`,
      sources: collisionSources,
    });
  }

  return { written, warnings, unsupported };
}
