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
  isAgentIgnore,
  isAgentCommand,
} from '@a16njs/models';

/**
 * Sanitize a filename to be safe for the filesystem.
 * Converts to lowercase, replaces spaces and special chars with hyphens.
 * Returns 'rule' if sanitization produces an empty string.
 */
function sanitizeFilename(sourcePath: string): string {
  // Get just the filename without directory
  const basename = path.basename(sourcePath);
  
  // Remove extension
  const nameWithoutExt = basename.replace(/\.[^.]+$/, '');
  
  // Convert to lowercase and replace unsafe characters
  const sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''); // Trim leading/trailing hyphens
  
  // Return fallback if empty
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
 * Generate a unique filename by appending a counter if needed.
 * Returns the unique filename and whether a collision occurred.
 */
function getUniqueFilename(
  baseName: string,
  usedNames: Set<string>
): { filename: string; collision: boolean } {
  if (!usedNames.has(baseName)) {
    usedNames.add(baseName);
    return { filename: baseName, collision: false };
  }

  // Collision detected - find unique name
  let counter = 2;
  let uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  while (usedNames.has(uniqueName)) {
    counter++;
    uniqueName = `${baseName.replace(/\.mdc$/, '')}-${counter}.mdc`;
  }
  usedNames.add(uniqueName);
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
 * Format content as MDC with AgentSkill frontmatter (description).
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
 * Emit agent customizations to Cursor format.
 * - GlobalPrompt → .mdc with alwaysApply: true
 * - FileRule → .mdc with globs:
 * - AgentSkill → .mdc with description:
 */
export async function emit(
  models: AgentCustomization[],
  root: string
): Promise<EmitResult> {
  const written: WrittenFile[] = [];
  const warnings: Warning[] = [];
  const unsupported: AgentCustomization[] = [];
  const usedFilenames = new Set<string>();

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

  const allItems = [...globalPrompts, ...fileRules, ...agentSkills];
  
  // Early return only if no items at all (including agentIgnores and agentCommands)
  if (allItems.length === 0 && agentIgnores.length === 0 && agentCommands.length === 0) {
    return { written, warnings, unsupported };
  }

  // Track sources that had collisions for warning
  const collisionSources: string[] = [];
  
  // Ensure .cursor/rules directory exists (only if we have mdc items)
  const rulesDir = path.join(root, '.cursor', 'rules');
  if (allItems.length > 0) {
    await fs.mkdir(rulesDir, { recursive: true });
  }

  // Emit each GlobalPrompt as a separate .mdc file
  for (const gp of globalPrompts) {
    const baseName = sanitizeFilename(gp.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(gp.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
    const content = formatGlobalPromptMdc(gp.content);

    await fs.writeFile(filepath, content, 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.GlobalPrompt,
      itemCount: 1,
    });
  }

  // Emit each FileRule as a separate .mdc file with globs
  for (const fr of fileRules) {
    const baseName = sanitizeFilename(fr.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(fr.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
    const content = formatFileRuleMdc(fr.content, fr.globs);

    await fs.writeFile(filepath, content, 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.FileRule,
      itemCount: 1,
    });
  }

  // Emit each AgentSkill as a separate .mdc file with description
  for (const skill of agentSkills) {
    const baseName = sanitizeFilename(skill.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(skill.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
    const content = formatAgentSkillMdc(skill.content, skill.description);

    await fs.writeFile(filepath, content, 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.AgentSkill,
      itemCount: 1,
    });
  }

  // Emit warning if any collisions occurred
  if (collisionSources.length > 0) {
    warnings.push({
      code: WarningCode.FileRenamed,
      message: `Filename collision: ${collisionSources.length} file(s) renamed to avoid overwrite`,
      sources: collisionSources,
    });
  }

  // === Emit AgentIgnores as .cursorignore ===
  if (agentIgnores.length > 0) {
    const allPatterns = agentIgnores.flatMap(ai => ai.patterns);
    const uniquePatterns = [...new Set(allPatterns)];
    const filepath = path.join(root, '.cursorignore');
    
    await fs.writeFile(filepath, uniquePatterns.join('\n') + '\n', 'utf-8');

    written.push({
      path: filepath,
      type: CustomizationType.AgentIgnore,
      itemCount: agentIgnores.length,
    });

    if (agentIgnores.length > 1) {
      warnings.push({
        code: WarningCode.Merged,
        message: `Merged ${agentIgnores.length} ignore sources into .cursorignore`,
        sources: agentIgnores.map(ai => ai.sourcePath),
      });
    }
  }

  // === Emit AgentCommands as .cursor/commands/*.md ===
  if (agentCommands.length > 0) {
    const commandsDir = path.join(root, '.cursor', 'commands');
    await fs.mkdir(commandsDir, { recursive: true });
    const usedCommandNames = new Set<string>();
    const commandCollisionSources: string[] = [];

    for (const command of agentCommands) {
      // Sanitize command name to prevent path traversal
      const baseName = sanitizeCommandName(command.commandName);
      
      // Get unique filename to avoid collisions
      let filename = `${baseName}.md`;
      if (usedCommandNames.has(filename)) {
        // Collision detected - track for warning
        commandCollisionSources.push(command.sourcePath);
        let counter = 2;
        while (usedCommandNames.has(`${baseName}-${counter}.md`)) {
          counter++;
        }
        filename = `${baseName}-${counter}.md`;
      }
      usedCommandNames.add(filename);

      const commandPath = path.join(commandsDir, filename);
      await fs.writeFile(commandPath, command.content, 'utf-8');

      written.push({
        path: commandPath,
        type: CustomizationType.AgentCommand,
        itemCount: 1,
      });
    }

    // Emit warning if any command collisions occurred
    if (commandCollisionSources.length > 0) {
      warnings.push({
        code: WarningCode.FileRenamed,
        message: `Command filename collision: ${commandCollisionSources.length} file(s) renamed to avoid overwrite`,
        sources: commandCollisionSources,
      });
    }
  }

  return { written, warnings, unsupported };
}
