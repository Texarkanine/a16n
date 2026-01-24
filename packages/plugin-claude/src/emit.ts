import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type EmitResult,
  type WrittenFile,
  type Warning,
  type FileRule,
  type AgentSkill,
  CustomizationType,
  WarningCode,
  isGlobalPrompt,
  isFileRule,
  isAgentSkill,
} from '@a16n/models';

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
      command: `npx @a16n/glob-hook --globs "${globsArg}" --context-file "${escapedRulePath}"`,
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
 * Emit agent customizations to Claude format.
 * - GlobalPrompts → CLAUDE.md
 * - FileRules → .a16n/rules/ + .claude/settings.local.json
 * - AgentSkills → .claude/skills/ subdirectories
 */
export async function emit(
  models: AgentCustomization[],
  root: string
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];

  // Separate by type
  const globalPrompts = models.filter(isGlobalPrompt);
  const fileRules = models.filter(isFileRule);
  const agentSkills = models.filter(isAgentSkill);

  // Track unsupported types (AgentIgnore, etc.)
  for (const model of models) {
    if (!isGlobalPrompt(model) && !isFileRule(model) && !isAgentSkill(model)) {
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

    await fs.writeFile(claudePath, content, 'utf-8');

    written.push({
      path: claudePath,
      type: CustomizationType.GlobalPrompt,
      itemCount: globalPrompts.length,
    });

    if (globalPrompts.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${globalPrompts.length} items into single CLAUDE.md`,
        sources: globalPrompts.map((gp) => gp.sourcePath),
      });
    }
  }

  // === Emit FileRules as .a16n/rules/*.txt + .claude/settings.local.json ===
  if (fileRules.length > 0) {
    // Create .a16n/rules directory
    const rulesDir = path.join(root, '.a16n', 'rules');
    await fs.mkdir(rulesDir, { recursive: true });

    // Create .claude directory for settings
    const claudeDir = path.join(root, '.claude');
    await fs.mkdir(claudeDir, { recursive: true });

    const hooks: object[] = [];
    const usedFilenames = new Set<string>();

    for (const rule of fileRules) {
      // Get unique filename to avoid collisions
      let baseName = sanitizeFilename(rule.sourcePath);
      let filename = baseName + '.txt';
      let counter = 1;
      while (usedFilenames.has(filename)) {
        filename = `${baseName}-${counter}.txt`;
        counter++;
      }
      usedFilenames.add(filename);

      const rulePath = `.a16n/rules/${filename}`;
      const fullPath = path.join(root, rulePath);

      // Write rule content
      await fs.writeFile(fullPath, rule.content, 'utf-8');

      written.push({
        path: fullPath,
        type: CustomizationType.FileRule,
        itemCount: 1,
      });

      // Build hook for this rule
      hooks.push(buildHookConfig(rule, rulePath));
    }

    // Write settings.local.json, merging with existing content if present
    const settingsPath = path.join(claudeDir, 'settings.local.json');
    let settings: Record<string, unknown> = { hooks: { PreToolUse: hooks } };
    
    try {
      const existingContent = await fs.readFile(settingsPath, 'utf-8');
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
    }
    
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');

    written.push({
      path: settingsPath,
      type: CustomizationType.FileRule,
      itemCount: fileRules.length,
    });

    // Emit approximation warning
    warnings.push({
      code: WarningCode.Approximated,
      message: `FileRule approximated via @a16n/glob-hook (behavior may differ slightly)`,
      sources: fileRules.map((r) => r.sourcePath),
    });
  }

  // === Emit AgentSkills as .claude/skills/*/SKILL.md ===
  if (agentSkills.length > 0) {
    const usedSkillNames = new Set<string>();

    for (const skill of agentSkills) {
      // Get unique skill name to avoid directory collisions
      let baseName = sanitizeFilename(skill.sourcePath);
      let skillName = baseName;
      let counter = 1;
      while (usedSkillNames.has(skillName)) {
        skillName = `${baseName}-${counter}`;
        counter++;
      }
      usedSkillNames.add(skillName);

      const skillDir = path.join(root, '.claude', 'skills', skillName);
      await fs.mkdir(skillDir, { recursive: true });

      const skillPath = path.join(skillDir, 'SKILL.md');
      const content = formatSkill(skill);
      await fs.writeFile(skillPath, content, 'utf-8');

      written.push({
        path: skillPath,
        type: CustomizationType.AgentSkill,
        itemCount: 1,
      });
    }
  }

  return { written, warnings, unsupported };
}
