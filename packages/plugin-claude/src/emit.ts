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
 * Build hook configuration for a FileRule.
 */
function buildHookConfig(fileRule: FileRule, rulePath: string): object {
  const globsArg = fileRule.globs.join(',');
  return {
    matcher: 'Read|Write|Edit',
    hooks: [{
      type: 'command',
      command: `npx @a16n/glob-hook --globs "${globsArg}" --context-file "${rulePath}"`,
    }],
  };
}

/**
 * Format a skill file with YAML frontmatter.
 */
function formatSkill(skill: AgentSkill): string {
  return `---
description: ${skill.description}
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

    for (const rule of fileRules) {
      const filename = sanitizeFilename(rule.sourcePath) + '.txt';
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

    // Write settings.local.json with all hooks
    const settings = {
      hooks: {
        PreToolUse: hooks,
      },
    };
    const settingsPath = path.join(claudeDir, 'settings.local.json');
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
    for (const skill of agentSkills) {
      const skillName = sanitizeFilename(skill.sourcePath);
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
