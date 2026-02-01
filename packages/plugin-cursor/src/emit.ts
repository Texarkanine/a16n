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
  CustomizationType,
  WarningCode,
  isGlobalPrompt,
  isFileRule,
  isSimpleAgentSkill,
  isAgentSkillIO,
  isAgentIgnore,
  isManualPrompt,
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
  const skillName = (skill.metadata?.name as string) || sanitizeFilename(skill.sourcePath);
  const safeName = JSON.stringify(skillName);
  const safeDescription = JSON.stringify(skill.description);

  return `---
name: ${safeName}
description: ${safeDescription}
---

${skill.content}
`;
}

/**
 * Format ManualPrompt as a SKILL.md file with disable-model-invocation.
 * Used for .cursor/skills/ emission (Phase 7).
 */
function formatManualPromptSkillMd(prompt: import('@a16njs/models').ManualPrompt): string {
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
 * @returns Array of written files
 */
async function emitAgentSkillIO(
  skill: AgentSkillIO,
  root: string,
  dryRun: boolean,
  warnings: Warning[],
  usedSkillNames: Set<string>
): Promise<WrittenFile[]> {
  const written: WrittenFile[] = [];

  // Check if skill is effectively simple (no resources, no files)
  const isSimple = (!skill.resources || skill.resources.length === 0) &&
                   Object.keys(skill.files).length === 0;

  if (isSimple) {
    // Simple AgentSkillIO → emit idiomatically
    if (skill.disableModelInvocation) {
      // Emit as ManualPrompt skill (.cursor/skills/<name>/SKILL.md with disable flag)
      const baseName = sanitizePromptName(skill.name);
      let dirName = baseName;
      if (usedSkillNames.has(dirName)) {
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
      const usedFilenames = new Set<string>();
      const { filename } = getUniqueFilename(baseName, usedFilenames);

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
  root: string,
  options?: EmitOptions
): Promise<EmitResult> {
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
  const skillItems = [...agentSkills, ...manualPrompts];
  
  // Early return only if no items at all (including agentIgnores and agentSkillIOs)
  if (mdcItems.length === 0 && skillItems.length === 0 && agentSkillIOs.length === 0 && agentIgnores.length === 0) {
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
    const baseName = sanitizeFilename(gp.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(gp.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
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
    const baseName = sanitizeFilename(fr.sourcePath) + '.mdc';
    const { filename, collision } = getUniqueFilename(baseName, usedFilenames);
    
    if (collision) {
      collisionSources.push(fr.sourcePath);
    }

    const filepath = path.join(rulesDir, filename);
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
    // Get skill name from metadata or sourcePath
    const skillName = (skill.metadata?.name as string) || sanitizeFilename(skill.sourcePath);
    const baseName = sanitizePromptName(skillName);
    
    // Get unique name to avoid collisions
    let dirName = baseName;
    if (usedSkillNames.has(dirName)) {
      collisionSources.push(skill.sourcePath);
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
        sources: agentIgnores.map(ai => ai.sourcePath),
      });
    }
  }

  // === Emit ManualPrompts as .cursor/skills/*/SKILL.md (Phase 7) ===
  for (const prompt of manualPrompts) {
    // Sanitize prompt name to prevent path traversal
    const baseName = sanitizePromptName(prompt.promptName);
    
    // Get unique name to avoid collisions (shared with AgentSkills)
    let dirName = baseName;
    if (usedSkillNames.has(dirName)) {
      collisionSources.push(prompt.sourcePath);
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
    const content = formatManualPromptSkillMd(prompt);

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
      type: CustomizationType.ManualPrompt,
      itemCount: 1,
      isNewFile,
      sourceItems: [prompt],
    });
  }

  // === Emit AgentSkillIOs (Phase 8 B4) ===
  for (const skillIO of agentSkillIOs) {
    const skillIOWritten = await emitAgentSkillIO(skillIO, root, dryRun, warnings, usedSkillNames);
    written.push(...skillIOWritten);
  }

  return { written, warnings, unsupported };
}
