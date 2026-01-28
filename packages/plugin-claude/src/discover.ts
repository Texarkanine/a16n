import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentIgnore,
  type AgentSkill,
  type ManualPrompt,
  type DiscoveryResult,
  type Warning,
  CustomizationType,
  WarningCode,
  createId,
} from '@a16njs/models';

/**
 * Convert a Claude Read() permission rule to a gitignore-style pattern.
 * Returns null for non-Read rules.
 */
function convertReadRuleToPattern(rule: string): string | null {
  const match = rule.match(/^Read\(\.\/(.+)\)$/);
  if (!match) return null;

  let pattern = match[1]!;

  // Read(./dist/**) → dist/
  if (pattern.endsWith('/**')) {
    return pattern.slice(0, -2);
  }
  // Read(./**/*.log) → *.log
  if (pattern.startsWith('**/')) {
    return pattern.slice(3);
  }
  // Read(./.env) → .env
  return pattern;
}

/**
 * Parse YAML-like frontmatter from a SKILL.md file.
 * Returns the frontmatter key-values and body content.
 */
interface SkillFrontmatter {
  description?: string;
  name?: string;
  hasHooks: boolean;
  disableModelInvocation?: boolean;
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}

function parseSkillFrontmatter(content: string): ParsedSkill {
  const lines = content.split('\n');
  
  let frontmatterStart = -1;
  let frontmatterEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line === '---') {
      if (frontmatterStart === -1) {
        frontmatterStart = i;
      } else {
        frontmatterEnd = i;
        break;
      }
    }
  }
  
  // No frontmatter found
  if (frontmatterStart === -1 || frontmatterEnd === -1) {
    return {
      frontmatter: { hasHooks: false },
      body: content.trim(),
    };
  }
  
  const frontmatter: SkillFrontmatter = { hasHooks: false };
  
  // Parse frontmatter lines
  for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Check for hooks: key (indicates skill-scoped hooks)
    if (line.match(/^hooks:\s*$/)) {
      frontmatter.hasHooks = true;
      continue;
    }
    
    // Parse description: "..."
    const descriptionMatch = line.match(/^description:\s*["']?(.+?)["']?\s*$/);
    if (descriptionMatch) {
      frontmatter.description = descriptionMatch[1];
      continue;
    }
    
    // Parse name: "..."
    const nameMatch = line.match(/^name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch) {
      frontmatter.name = nameMatch[1];
      continue;
    }

    // Parse disable-model-invocation: true
    const disableMatch = line.match(/^disable-model-invocation:\s*(true|false)\s*$/);
    if (disableMatch) {
      frontmatter.disableModelInvocation = disableMatch[1] === 'true';
      continue;
    }
  }
  
  // Extract body (everything after second ---)
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const body = bodyLines.join('\n').trim();
  
  return { frontmatter, body };
}

/**
 * Find all SKILL.md files in .claude/skills/ subdirectories.
 * Returns paths like ".claude/skills/testing/SKILL.md"
 */
async function findSkillFiles(root: string): Promise<string[]> {
  const results: string[] = [];
  const skillsDir = path.join(root, '.claude', 'skills');
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
        try {
          await fs.access(skillFile);
          results.push(`.claude/skills/${entry.name}/SKILL.md`);
        } catch {
          // No SKILL.md in this directory
        }
      }
    }
  } catch {
    // .claude/skills doesn't exist
  }
  
  return results;
}

/**
 * Recursively find all CLAUDE.md files in a directory tree.
 */
async function findClaudeFiles(
  root: string,
  currentDir: string = ''
): Promise<string[]> {
  const results: string[] = [];
  const fullPath = currentDir ? path.join(root, currentDir) : root;

  try {
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip node_modules and hidden directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const relativePath = currentDir
        ? path.join(currentDir, entry.name)
        : entry.name;

      if (entry.isFile() && entry.name === 'CLAUDE.md') {
        results.push(relativePath);
      } else if (entry.isDirectory()) {
        const nested = await findClaudeFiles(root, relativePath);
        results.push(...nested);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return results;
}

/**
 * Discover AgentIgnore from .claude/settings.json permissions.deny Read rules.
 * Returns null if settings.json doesn't exist or has no Read rules.
 */
async function discoverAgentIgnore(root: string): Promise<AgentIgnore | null> {
  const settingsPath = path.join(root, '.claude', 'settings.json');

  try {
    const content = await fs.readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content) as Record<string, unknown>;
    const permissions = settings.permissions as Record<string, unknown> | undefined;
    const rawDeny = Array.isArray(permissions?.deny) ? permissions.deny : [];
    // Filter to only string entries to avoid startsWith throwing on non-strings
    const denyRules = rawDeny.filter((r): r is string => typeof r === 'string');
    const readRules = denyRules.filter(r => r.startsWith('Read('));

    const patterns = readRules
      .map(convertReadRuleToPattern)
      .filter((p): p is string => p !== null);

    if (patterns.length === 0) return null;

    return {
      id: createId(CustomizationType.AgentIgnore, '.claude/settings.json'),
      type: CustomizationType.AgentIgnore,
      sourcePath: '.claude/settings.json',
      content: JSON.stringify({ permissions: { deny: readRules } }, null, 2),
      patterns,
      metadata: { originalRules: readRules },
    };
  } catch {
    return null;
  }
}

/**
 * Discover all CLAUDE.md files and skills in a project directory.
 */
export async function discover(root: string): Promise<DiscoveryResult> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  // Find all CLAUDE.md files (GlobalPrompt)
  const claudeFiles = await findClaudeFiles(root);

  for (const file of claudeFiles) {
    const fullPath = path.join(root, file);
    
    // Normalize path separators for cross-platform consistency
    const normalizedPath = file.split(path.sep).join('/');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');

      // Calculate nesting depth
      const depth = file.split(path.sep).length - 1;
      const isNested = depth > 0;

      items.push({
        id: createId(CustomizationType.GlobalPrompt, normalizedPath),
        type: CustomizationType.GlobalPrompt,
        sourcePath: normalizedPath,
        content,
        metadata: {
          nested: isNested,
          depth,
        },
      });
    } catch (error) {
      // File couldn't be read - add warning and continue
      warnings.push({
        code: WarningCode.Skipped,
        message: `Could not read ${normalizedPath}: ${(error as Error).message}`,
        sources: [normalizedPath],
      });
    }
  }

  // Find all .claude/skills/*/SKILL.md files (AgentSkill)
  const skillFiles = await findSkillFiles(root);

  for (const skillPath of skillFiles) {
    const fullPath = path.join(root, skillPath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, body } = parseSkillFrontmatter(content);
      
      // Extract skill name from path (e.g., "testing" from ".claude/skills/testing/SKILL.md")
      const skillName = skillPath.split('/')[2] || 'unknown';
      
      // Skip skills with hooks - they're not convertible to Cursor
      if (frontmatter.hasHooks) {
        const displayName = frontmatter.name || skillName;
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${displayName}': Contains hooks (not convertible to Cursor)`,
          sources: [skillPath],
        });
        continue;
      }
      
      // Classification priority:
      // 1. disable-model-invocation: true -> ManualPrompt
      // 2. description present -> AgentSkill
      if (frontmatter.disableModelInvocation === true) {
        const prompt: ManualPrompt = {
          id: createId(CustomizationType.ManualPrompt, skillPath),
          type: CustomizationType.ManualPrompt,
          sourcePath: skillPath,
          content: body,
          promptName: frontmatter.name || skillName,
          metadata: {
            name: frontmatter.name || skillName,
          },
        };
        items.push(prompt);
      } else if (frontmatter.description) {
        const skill: AgentSkill = {
          id: createId(CustomizationType.AgentSkill, skillPath),
          type: CustomizationType.AgentSkill,
          sourcePath: skillPath,
          content: body,
          description: frontmatter.description,
          metadata: {
            name: frontmatter.name || skillName,
          },
        };
        items.push(skill);
      }
    } catch (error) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Could not read ${skillPath}: ${(error as Error).message}`,
        sources: [skillPath],
      });
    }
  }

  // Discover AgentIgnore from .claude/settings.json (Phase 3)
  const agentIgnore = await discoverAgentIgnore(root);
  if (agentIgnore) {
    items.push(agentIgnore);
  }

  return { items, warnings };
}
