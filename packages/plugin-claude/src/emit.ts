import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentCommand,
  type EmitResult,
  type EmitOptions,
  type WrittenFile,
  type Warning,
  type FileRule,
  type AgentSkill,
  CustomizationType,
  WarningCode,
  isGlobalPrompt,
  isFileRule,
  isAgentSkill,
  isAgentIgnore,
  isAgentCommand,
  getUniqueFilename,
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
 * Sanitize a command name to prevent path traversal and ensure filesystem safety.
 * Returns a safe string with only alphanumeric characters and hyphens.
 */
function sanitizeCommandName(commandName: string): string {
  // Remove any path separators and normalize
  const sanitized = commandName
    .toLowerCase()
    .replace(/[/\\]/g, '-')  // Replace path separators with hyphens
    .replace(/[^a-z0-9]+/g, '-')  // Replace other unsafe chars with hyphens
    .replace(/^-+|-+$/g, '');  // Trim leading/trailing hyphens
  return sanitized || 'command';
}

/**
 * Escape a string for safe use in double-quoted shell arguments.
 * Escapes: backslash, double quote, dollar sign, backtick.
 */
function escapeShellArg(str: string): string {
  return str.replace(/[\\"`$]/g, '\\$&');
}

/**
 * Build hook configuration for a FileRule.
 */
function buildHookConfig(fileRule: FileRule, rulePath: string): object {
  // Escape globs and rulePath to prevent command injection
  const escapedGlobs = fileRule.globs.map(g => escapeShellArg(g));
  const globsArg = escapedGlobs.join(',');
  const escapedRulePath = escapeShellArg(rulePath);
  return {
    matcher: 'Read|Write|Edit',
    hooks: [{
      type: 'command',
      command: `npx @a16njs/glob-hook --globs "${globsArg}" --context-file "${escapedRulePath}"`,
    }],
  };
}

/**
 * Format a skill file with YAML frontmatter.
 * Name and description are quoted to handle YAML special characters.
 */
function formatSkill(skill: AgentSkill): string {
  // Quote values to handle YAML special characters (: # { } etc.)
  const safeDescription = JSON.stringify(skill.description);
  const skillName = skill.metadata?.name as string | undefined;
  
  // Include name in frontmatter if available
  if (skillName) {
    const safeName = JSON.stringify(skillName);
    return `---
name: ${safeName}
description: ${safeDescription}
---

${skill.content}
`;
  }
  
  return `---
description: ${safeDescription}
---

${skill.content}
`;
}

/**
 * Format an AgentCommand as a Claude skill.
 * The description enables /command-name invocation.
 */
function formatCommandAsSkill(command: AgentCommand): string {
  const safeName = JSON.stringify(command.commandName);
  const description = `Invoke with /${command.commandName}`;
  const safeDescription = JSON.stringify(description);

  return `---
name: ${safeName}
description: ${safeDescription}
---

${command.content}
`;
}

/**
 * Emit agent customizations to Claude format.
 * - GlobalPrompts → CLAUDE.md
 * - FileRules → .a16n/rules/ + .claude/settings.local.json
 * - AgentSkills → .claude/skills/ subdirectories
 * 
 * @param models - The customizations to emit
 * @param root - The root directory to write to
 * @param options - Optional emit options (e.g., dryRun)
 */
export async function emit(
  models: AgentCustomization[],
  root: string,
  options?: EmitOptions
): Promise<EmitResult> {
  const dryRun = options?.dryRun ?? false;
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];

  // Separate by type
  const globalPrompts = models.filter(isGlobalPrompt);
  const fileRules = models.filter(isFileRule);
  const agentSkills = models.filter(isAgentSkill);
  const agentIgnores = models.filter(isAgentIgnore);
  const agentCommands = models.filter(isAgentCommand);

  // Track unsupported types (future types)
  for (const model of models) {
    if (!isGlobalPrompt(model) && !isFileRule(model) && !isAgentSkill(model) && !isAgentIgnore(model) && !isAgentCommand(model)) {
      unsupported.push(model);
    }
  }

  // === Emit GlobalPrompts as CLAUDE.md ===
  if (globalPrompts.length > 0) {
    const sections = globalPrompts.map((gp) => {
      const header = `## From: ${gp.sourcePath}`;
      return `${header}\n\n${gp.content}`;
    });

    const content = sections.join('\n\n---\n\n');
    const claudePath = path.join(root, 'CLAUDE.md');

    // Check if file exists before writing
    let isNewFile = true;
    try {
      await fs.access(claudePath);
      isNewFile = false; // File exists
    } catch {
      isNewFile = true; // File does not exist
    }

    if (!dryRun) {
      await fs.writeFile(claudePath, content, 'utf-8');
    }

    written.push({
      path: claudePath,
      type: CustomizationType.GlobalPrompt,
      itemCount: globalPrompts.length,
      isNewFile,
    });

    if (globalPrompts.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${globalPrompts.length} items into single CLAUDE.md`,
        sources: globalPrompts.map((gp) => gp.sourcePath),
      });
    }
  }

  // === Emit FileRules as .a16n/rules/*.md + .claude/settings.local.json ===
  if (fileRules.length > 0) {
    const hooks: object[] = [];
    const usedFilenames = new Set<string>();
    let validFileRulesExist = false;

    for (const rule of fileRules) {
      // Filter valid globs (non-empty after trim)
      const validGlobs = rule.globs.filter(g => g.trim().length > 0);
      
      // Skip FileRules with no valid glob patterns
      if (validGlobs.length === 0) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `FileRule skipped due to empty globs: ${rule.sourcePath}`,
          sources: [rule.sourcePath],
        });
        continue;
      }
      
      // Create directories only when we have valid rules (skip in dry-run)
      if (!validFileRulesExist && !dryRun) {
        const rulesDir = path.join(root, '.a16n', 'rules');
        await fs.mkdir(rulesDir, { recursive: true });
        const claudeDir = path.join(root, '.claude');
        await fs.mkdir(claudeDir, { recursive: true });
      }
      validFileRulesExist = true;

      // Get unique filename to avoid collisions
      const baseName = sanitizeFilename(rule.sourcePath);
      const filename = getUniqueFilename(baseName, usedFilenames, '.md');

      const rulePath = `.a16n/rules/${filename}`;
      const fullPath = path.join(root, rulePath);

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
        await fs.writeFile(fullPath, rule.content, 'utf-8');
      }

      written.push({
        path: fullPath,
        type: CustomizationType.FileRule,
        itemCount: 1,
        isNewFile,
      });

      // Build hook for this rule with filtered valid globs
      const filteredRule = { ...rule, globs: validGlobs };
      hooks.push(buildHookConfig(filteredRule, rulePath));
    }

    // Only write settings.local.json if there are valid hooks
    if (hooks.length > 0) {
      const claudeDir = path.join(root, '.claude');
      if (!dryRun) {
        await fs.mkdir(claudeDir, { recursive: true });
      }
      
      // Write settings.local.json, merging with existing content if present
      const settingsPath = path.join(claudeDir, 'settings.local.json');
      let settings: Record<string, unknown> = { hooks: { PreToolUse: hooks } };
      let isNewFile = true;
      
      try {
        const existingContent = await fs.readFile(settingsPath, 'utf-8');
        isNewFile = false; // File exists
        const existing = JSON.parse(existingContent) as Record<string, unknown>;
        const existingHooks = existing.hooks as Record<string, unknown[]> | undefined;
        const existingPreToolUse = Array.isArray(existingHooks?.PreToolUse)
          ? existingHooks.PreToolUse
          : [];
        
        // Merge: preserve existing settings, append new PreToolUse hooks
        settings = {
          ...existing,
          hooks: {
            ...existingHooks,
            PreToolUse: [...existingPreToolUse, ...hooks],
          },
        };
      } catch (err: unknown) {
        // File doesn't exist or isn't valid JSON - use fresh settings
        if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
          // Only warn if it's not a "file not found" error
          warnings.push({
            code: WarningCode.Skipped,
            message: `Could not parse existing settings.local.json, overwriting: ${(err as Error).message}`,
            sources: [settingsPath],
          });
        }
        // If ENOENT, isNewFile remains true
      }
      
      if (!dryRun) {
        await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      }

      written.push({
        path: settingsPath,
        type: CustomizationType.FileRule,
        itemCount: hooks.length,
        isNewFile,
      });

      // Emit approximation warning for successfully processed FileRules
      const processedRules = fileRules.filter(r => r.globs.some(g => g.trim().length > 0));
      warnings.push({
        code: WarningCode.Approximated,
        message: `FileRule approximated via @a16njs/glob-hook (behavior may differ slightly)`,
        sources: processedRules.map((r) => r.sourcePath),
      });
    }
  }

  // Track .claude/skills directory names across skills + commands to prevent collisions
  const usedSkillNames = new Set<string>();

  // === Emit AgentSkills as .claude/skills/*/SKILL.md ===
  if (agentSkills.length > 0) {
    for (const skill of agentSkills) {
      // Get unique skill name to avoid directory collisions
      const baseName = sanitizeFilename(skill.sourcePath);
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
        type: CustomizationType.AgentSkill,
        itemCount: 1,
        isNewFile,
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
        sources: agentIgnores.map(ai => ai.sourcePath),
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
    });

    warnings.push({
      code: WarningCode.Approximated,
      message: `AgentIgnore approximated as permissions.deny (behavior may differ slightly)`,
      sources: agentIgnores.map(ai => ai.sourcePath),
    });
  }

  // === Emit AgentCommands as .claude/skills/*/SKILL.md ===
  if (agentCommands.length > 0) {
    for (const command of agentCommands) {
      // Sanitize command name to prevent path traversal
      const baseName = sanitizeCommandName(command.commandName);
      // Get unique skill name to avoid directory collisions
      const skillName = getUniqueFilename(baseName, usedSkillNames);

      const skillDir = path.join(root, '.claude', 'skills', skillName);
      if (!dryRun) {
        await fs.mkdir(skillDir, { recursive: true });
      }

      const skillPath = path.join(skillDir, 'SKILL.md');
      const content = formatCommandAsSkill(command);
      
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
        type: CustomizationType.AgentCommand,
        itemCount: 1,
        isNewFile,
      });
    }
  }

  return { written, warnings, unsupported };
}
