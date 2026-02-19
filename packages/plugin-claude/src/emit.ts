import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type ManualPrompt,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
  type Warning,
  type FileRule,
  type GlobalPrompt,
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
  getUniqueFilename,
  resolveRoot,
} from '@a16njs/models';

/**
 * Convert a gitignore-style pattern to a Claude Read() permission rule.
 * Returns null for patterns that cannot be converted (e.g., negation patterns).
 */
function convertPatternToReadRule(pattern: string): string | null {
  // Negation patterns cannot be converted to deny rules
  // (they would need to REMOVE entries from deny, not add them)
  if (pattern.startsWith('!')) {
    return null;
  }
  // Directory pattern: dist/ → Read(./dist/**)
  if (pattern.endsWith('/')) {
    return `Read(./${pattern}**)`;
  }
  // Glob pattern: *.log → Read(./**/*.log)
  if (pattern.startsWith('*') && !pattern.startsWith('**')) {
    return `Read(./**/${pattern})`;
  }
  // Already has **: **/*.tmp → Read(./**/*.tmp)
  if (pattern.startsWith('**')) {
    return `Read(./${pattern})`;
  }
  // Simple file: .env → Read(./.env)
  return `Read(./${pattern})`;
}

/**
 * Sanitize a filename from a source path.
 * Extracts base name and makes it filesystem-safe.
 */
function sanitizeFilename(sourcePath: string): string {
  const basename = path.basename(sourcePath);
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
 * Format a GlobalPrompt as a Claude rule file.
 * GlobalPrompts are emitted as plain markdown without frontmatter.
 * Includes source header for traceability.
 * 
 * @param gp - The GlobalPrompt to format
 * @returns Formatted markdown content
 */
function formatGlobalPromptAsClaudeRule(gp: GlobalPrompt): string {
  const header = `## From: ${gp.sourcePath}`;
  return `${header}\n\n${gp.content}`;
}

/**
 * Format a FileRule as a Claude rule file with paths frontmatter.
 * FileRules are emitted with YAML frontmatter containing the globs as paths.
 * 
 * @param fr - The FileRule to format
 * @returns Formatted markdown with YAML frontmatter
 */
function formatFileRuleAsClaudeRule(fr: FileRule): string {
  // Format globs as YAML array
  const pathsArray = fr.globs.map(glob => `  - ${glob}`).join('\n');
  const frontmatter = `---
paths:
${pathsArray}
---`;
  
  const header = `## From: ${fr.sourcePath}`;
  return `${frontmatter}\n\n${header}\n\n${fr.content}`;
}

/**
 * Format a skill file with YAML frontmatter.
 * Name and description are quoted to handle YAML special characters.
 */
function formatSkill(skill: SimpleAgentSkill): string {
  const safeDescription = JSON.stringify(skill.description);
  const displayName = (skill.metadata?.name as string) || skill.name;
  const safeName = JSON.stringify(displayName);
  return `---
name: ${safeName}
description: ${safeDescription}
---

${skill.content}
`;
}

/**
 * Format a ManualPrompt as a Claude skill.
 * The description enables /prompt-name invocation.
 * Includes disable-model-invocation: true to indicate manual-only.
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
 * Emit an AgentSkillIO to Claude format.
 * Claude natively supports the full AgentSkills.io standard.
 * Always emits to .claude/skills/<name>/ with:
 * - SKILL.md with full frontmatter
 * - All resource files from the files map
 * 
 * @param skill - The AgentSkillIO to emit
 * @param root - Root directory to write to
 * @param dryRun - If true, don't write files
 * @param usedSkillNames - Set of used skill directory names (for collision detection)
 * @returns Array of written files
 */
async function emitAgentSkillIO(
  skill: AgentSkillIO,
  root: string,
  dryRun: boolean,
  usedSkillNames: Set<string>
): Promise<WrittenFile[]> {
  const written: WrittenFile[] = [];

  // Get unique skill name to avoid directory collisions
  const baseName = sanitizeFilename(skill.name);
  const skillName = getUniqueFilename(baseName, usedSkillNames);

  const skillDir = path.join(root, '.claude', 'skills', skillName);
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
  for (const [filename, content] of Object.entries(skill.files)) {
    const filePath = path.join(skillDir, filename);
    
    let isResourceNewFile = true;
    try {
      await fs.access(filePath);
      isResourceNewFile = false;
    } catch {
      isResourceNewFile = true;
    }

    if (!dryRun) {
      await fs.writeFile(filePath, content, 'utf-8');
    }

    written.push({
      path: filePath,
      type: CustomizationType.AgentSkillIO,
      itemCount: 1,
      isNewFile: isResourceNewFile,
      sourceItems: [skill],
    });
  }

  return written;
}

/**
 * Emit agent customizations to Claude format.
 * - GlobalPrompts → CLAUDE.md
 * - FileRules → .a16n/rules/ + .claude/settings.local.json
 * - AgentSkills → .claude/skills/ subdirectories
 * 
 * @param models - The customizations to emit
 * @param rootOrWorkspace - Root directory path or Workspace instance
 * @param options - Optional emit options (e.g., dryRun)
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

  // === Emit GlobalPrompts as .claude/rules/*.md ===
  if (globalPrompts.length > 0) {
    const rulesDir = path.join(root, '.claude', 'rules');
    if (!dryRun) {
      await fs.mkdir(rulesDir, { recursive: true });
    }

    const usedFilenames = new Set<string>();

    for (const gp of globalPrompts) {
      // Get unique filename to avoid collisions
      // Qualify with relativeDir to prevent false collisions across subdirectories
      const baseName = sanitizeFilename(gp.sourcePath || gp.id);
      const qualifiedName = gp.relativeDir ? `${gp.relativeDir}/${baseName}` : baseName;
      const qualifiedFilename = getUniqueFilename(qualifiedName, usedFilenames, '.md');
      const filename = gp.relativeDir ? path.basename(qualifiedFilename) : qualifiedFilename;

      // Use relativeDir for subdirectory nesting when present
      // Validate that relativeDir doesn't escape rulesDir via path traversal
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
      if (!dryRun) {
        await fs.mkdir(targetDir, { recursive: true });
      }
      const rulePath = path.join(targetDir, filename);
      const content = formatGlobalPromptAsClaudeRule(gp);

      // Check if file exists before writing
      let isNewFile = true;
      try {
        await fs.access(rulePath);
        isNewFile = false; // File exists
      } catch {
        isNewFile = true; // File does not exist
      }

      if (!dryRun) {
        await fs.writeFile(rulePath, content, 'utf-8');
      }

      written.push({
        path: rulePath,
        type: CustomizationType.GlobalPrompt,
        itemCount: 1,
        isNewFile,
        sourceItems: [gp],
      });
    }
  }

  // === Emit FileRules as .claude/rules/*.md ===
  if (fileRules.length > 0) {
    const rulesDir = path.join(root, '.claude', 'rules');
    const usedFilenames = new Set<string>();
    let validFileRulesExist = false;

    for (const rule of fileRules) {
      // Filter valid globs (non-empty after trim)
      const validGlobs = rule.globs.filter(g => g.trim().length > 0);
      
      // Skip FileRules with no valid glob patterns
      if (validGlobs.length === 0) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `FileRule skipped due to empty globs: ${rule.sourcePath || rule.id}`,
          sources: rule.sourcePath ? [rule.sourcePath] : [],
        });
        continue;
      }
      
      // Create directory only when we have valid rules (skip in dry-run)
      if (!validFileRulesExist && !dryRun) {
        await fs.mkdir(rulesDir, { recursive: true });
      }
      validFileRulesExist = true;

      // Get unique filename to avoid collisions
      // Qualify with relativeDir to prevent false collisions across subdirectories
      const baseName = sanitizeFilename(rule.sourcePath || rule.id);
      const qualifiedName = rule.relativeDir ? `${rule.relativeDir}/${baseName}` : baseName;
      const qualifiedFilename = getUniqueFilename(qualifiedName, usedFilenames, '.md');
      const filename = rule.relativeDir ? path.basename(qualifiedFilename) : qualifiedFilename;

      // Use relativeDir for subdirectory nesting when present
      // Validate that relativeDir doesn't escape rulesDir via path traversal
      const targetDir = rule.relativeDir
        ? path.join(rulesDir, rule.relativeDir)
        : rulesDir;
      const resolvedTarget = path.resolve(targetDir);
      const resolvedRules = path.resolve(rulesDir);
      if (rule.relativeDir && resolvedTarget !== resolvedRules && !resolvedTarget.startsWith(resolvedRules + path.sep)) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped rule with unsafe relativeDir: ${rule.relativeDir}`,
          sources: rule.sourcePath ? [rule.sourcePath] : [],
        });
        continue;
      }
      if (!dryRun) {
        await fs.mkdir(targetDir, { recursive: true });
      }
      const fullPath = path.join(targetDir, filename);

      // Filter to only valid globs for emission
      const filteredRule = { ...rule, globs: validGlobs };
      const content = formatFileRuleAsClaudeRule(filteredRule);

      // Check if file exists before writing
      let isNewFile = true;
      try {
        await fs.access(fullPath);
        isNewFile = false; // File exists
      } catch {
        isNewFile = true; // File does not exist
      }

      // Write rule content (skip in dry-run)
      if (!dryRun) {
        await fs.writeFile(fullPath, content, 'utf-8');
      }

      written.push({
        path: fullPath,
        type: CustomizationType.FileRule,
        itemCount: 1,
        isNewFile,
        sourceItems: [rule],
      });
    }
  }

  // Track .claude/skills directory names across skills + commands to prevent collisions
  const usedSkillNames = new Set<string>();

  // === Emit SimpleAgentSkills as .claude/skills/*/SKILL.md ===
  if (agentSkills.length > 0) {
    for (const skill of agentSkills) {
      // Use the invocation name (skill.name) when available; fall back to sanitized sourcePath
      const baseName = skill.name
        ? sanitizePromptName(skill.name)
        : sanitizeFilename(skill.sourcePath || skill.id);
      const skillName = getUniqueFilename(baseName, usedSkillNames);

      const skillDir = path.join(root, '.claude', 'skills', skillName);
      if (!dryRun) {
        await fs.mkdir(skillDir, { recursive: true });
      }

      const skillPath = path.join(skillDir, 'SKILL.md');
      const content = formatSkill(skill);
      
      // Check if file exists before writing
      let isNewFile = true;
      try {
        await fs.access(skillPath);
        isNewFile = false; // File exists
      } catch {
        isNewFile = true; // File does not exist
      }
      
      if (!dryRun) {
        await fs.writeFile(skillPath, content, 'utf-8');
      }

      written.push({
        path: skillPath,
        type: CustomizationType.SimpleAgentSkill,
        itemCount: 1,
        isNewFile,
        sourceItems: [skill],
      });
    }
  }

  // === Emit AgentIgnores as .claude/settings.json permissions.deny ===
  if (agentIgnores.length > 0) {
    const allPatterns = agentIgnores.flatMap(ai => ai.patterns);
    const negationPatterns = allPatterns.filter(p => p.startsWith('!'));
    const convertiblePatterns = allPatterns.filter(p => !p.startsWith('!'));
    
    const denyRules = convertiblePatterns
      .map(convertPatternToReadRule)
      .filter((rule): rule is string => rule !== null);

    // Warn about skipped negation patterns
    if (negationPatterns.length > 0) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Negation patterns cannot be converted to permissions.deny (skipped ${negationPatterns.length} pattern${negationPatterns.length > 1 ? 's' : ''}: ${negationPatterns.join(', ')})`,
        sources: agentIgnores.map(ai => ai.sourcePath).filter((s): s is string => s !== undefined),
      });
    }

    const claudeDir = path.join(root, '.claude');
    if (!dryRun) {
      await fs.mkdir(claudeDir, { recursive: true });
    }

    const settingsPath = path.join(claudeDir, 'settings.json');
    let settings: Record<string, unknown> = {};

    try {
      const existing = await fs.readFile(settingsPath, 'utf-8');
      settings = JSON.parse(existing) as Record<string, unknown>;
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        // File exists but is malformed - warn and proceed with fresh settings
        warnings.push({
          code: WarningCode.Skipped,
          message: `Could not parse existing settings.json, overwriting: ${(err as Error).message}`,
          sources: [settingsPath],
        });
      }
      // File doesn't exist or is malformed - use empty settings
    }

    // Check if settings.json existed (track if new file)
    let isNewFile = true;
    try {
      await fs.access(settingsPath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }

    // Merge deny rules (deduplicate)
    const existingPermissions = settings.permissions as Record<string, unknown> | undefined;
    const existingDeny = Array.isArray(existingPermissions?.deny)
      ? existingPermissions.deny as string[]
      : [];

    settings.permissions = {
      ...existingPermissions,
      deny: [...new Set([...existingDeny, ...denyRules])],
    };

    if (!dryRun) {
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    }

    written.push({
      path: settingsPath,
      type: CustomizationType.AgentIgnore,
      itemCount: agentIgnores.length,
      isNewFile,
      sourceItems: agentIgnores,
    });

    warnings.push({
      code: WarningCode.Approximated,
      message: `AgentIgnore approximated as permissions.deny (behavior may differ slightly)`,
      sources: agentIgnores.map(ai => ai.sourcePath).filter((s): s is string => s !== undefined),
    });
  }

  // === Emit ManualPrompts as .claude/skills/*/SKILL.md ===
  if (manualPrompts.length > 0) {
    for (const prompt of manualPrompts) {
      // Sanitize prompt name to prevent path traversal
      const baseName = sanitizePromptName(prompt.promptName);
      // Get unique skill name to avoid directory collisions
      const skillName = getUniqueFilename(baseName, usedSkillNames);

      const skillDir = path.join(root, '.claude', 'skills', skillName);
      if (!dryRun) {
        await fs.mkdir(skillDir, { recursive: true });
      }

      const skillPath = path.join(skillDir, 'SKILL.md');
      const content = formatManualPromptAsSkill(prompt);
      
      // Check if file exists before writing
      let isNewFile = true;
      try {
        await fs.access(skillPath);
        isNewFile = false; // File exists
      } catch {
        isNewFile = true; // File does not exist
      }
      
      if (!dryRun) {
        await fs.writeFile(skillPath, content, 'utf-8');
      }

      written.push({
        path: skillPath,
        type: CustomizationType.ManualPrompt,
        itemCount: 1,
        isNewFile,
        sourceItems: [prompt],
      });
    }
  }

  // === Emit AgentSkillIOs (Phase 8 B4) ===
  if (agentSkillIOs.length > 0) {
    for (const skillIO of agentSkillIOs) {
      const skillIOWritten = await emitAgentSkillIO(skillIO, root, dryRun, usedSkillNames);
      written.push(...skillIOWritten);
    }
  }

  return { written, warnings, unsupported };
}
