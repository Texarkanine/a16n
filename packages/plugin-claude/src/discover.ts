import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentIgnore,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type FileRule,
  type ManualPrompt,
  type DiscoveryResult,
  type Warning,
  type Workspace,
  CustomizationType,
  WarningCode,
  createId,
  resolveRoot,
  CURRENT_IR_VERSION,
} from '@a16njs/models';

/**
 * Frontmatter structure for Claude rules files.
 * Contains paths field for conditional file-based activation.
 */
interface ClaudeRuleFrontmatter {
  paths?: string | string[];
  [key: string]: unknown;
}

/**
 * Parsed Claude rule with frontmatter and body content.
 */
interface ParsedClaudeRule {
  frontmatter: ClaudeRuleFrontmatter;
  body: string;
}

/**
 * Recursively find all .md files in .claude/rules/ directory.
 * Returns relative paths like ".claude/rules/style.md" or ".claude/rules/frontend/react.md"
 * 
 * @param root - Project root directory
 * @returns Array of relative paths to rule files
 */
async function findClaudeRules(root: string): Promise<string[]> {
  const results: string[] = [];
  const rulesDir = path.join(root, '.claude', 'rules');

  async function traverse(currentDir: string, relativePath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip hidden directories (like .git)
        if (entry.name.startsWith('.')) {
          continue;
        }

        const entryRelativePath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        const entryFullPath = path.join(currentDir, entry.name);

        if (entry.isFile() && entry.name.endsWith('.md')) {
          // Found a rule file
          results.push(`.claude/rules/${entryRelativePath}`);
        } else if (entry.isDirectory()) {
          // Recurse into subdirectory
          await traverse(entryFullPath, entryRelativePath);
        }
      }
    } catch {
      // Directory doesn't exist or can't be read - that's okay
    }
  }

  await traverse(rulesDir, '');
  return results;
}

/**
 * Parse YAML frontmatter from a Claude rule file.
 * Extracts the paths field and other frontmatter metadata.
 * 
 * @param content - Full file content including frontmatter
 * @returns Parsed frontmatter and body content
 */
function parseClaudeRuleFrontmatter(content: string): ParsedClaudeRule {
  const lines = content.split('\n');
  
  let frontmatterStart = -1;
  let frontmatterEnd = -1;
  
  // Find frontmatter delimiters (---)
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
      frontmatter: {},
      body: content.trim(),
    };
  }
  
  const frontmatter: ClaudeRuleFrontmatter = {};
  
  // Parse frontmatter lines
  let i = frontmatterStart + 1;
  while (i < frontmatterEnd) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    
    // Check for paths: field
    const pathsMatch = line.match(/^paths:\s*$/);
    if (pathsMatch) {
      // Multi-line array format
      const paths: string[] = [];
      i++;
      while (i < frontmatterEnd) {
        const pathLine = lines[i];
        if (!pathLine) {
          i++;
          continue;
        }
        const arrayItemMatch = pathLine.match(/^\s*-\s*["']?(.+?)["']?\s*$/);
        if (arrayItemMatch) {
          paths.push(arrayItemMatch[1]!);
          i++;
        } else {
          // End of array
          break;
        }
      }
      if (paths.length > 0) {
        frontmatter.paths = paths;
      }
      continue;
    }
    
    // Check for paths: "value" or paths: ["value1", "value2"] (inline format)
    const pathsInlineMatch = line.match(/^paths:\s*(.+)$/);
    if (pathsInlineMatch) {
      const value = pathsInlineMatch[1]!.trim();
      // Try to parse as JSON array
      if (value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value) as unknown;
          if (Array.isArray(parsed)) {
            frontmatter.paths = parsed.filter((p): p is string => typeof p === 'string');
          }
        } catch {
          // Not valid JSON, treat as single string
          frontmatter.paths = [value.replace(/^["']|["']$/g, '')];
        }
      } else {
        // Single string value
        frontmatter.paths = [value.replace(/^["']|["']$/g, '')];
      }
      i++;
      continue;
    }
    
    // Store other frontmatter fields generically (allow hyphenated keys like disable-model-invocation)
    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.+)$/);
    if (keyValueMatch) {
      const key = keyValueMatch[1]!;
      const value = keyValueMatch[2]!.trim().replace(/^["']|["']$/g, '');
      frontmatter[key] = value;
    }
    
    i++;
  }
  
  // Extract body (everything after second ---)
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const body = bodyLines.join('\n').trim();
  
  return { frontmatter, body };
}

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
  hooks?: Record<string, unknown>;
  disableModelInvocation?: boolean;
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}

/**
 * Parse hooks section from frontmatter lines.
 * Returns the hooks object and the line index after the hooks section.
 */
function parseHooksSection(lines: string[], startIndex: number, endIndex: number): { hooks: Record<string, unknown>; nextIndex: number } {
  const hooks: Record<string, unknown> = {};
  let i = startIndex;
  
  while (i < endIndex) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    
    // Check if this is a hook name (e.g., "  pre-commit:")
    const hookMatch = line.match(/^  (\S+):\s*$/);
    if (hookMatch) {
      const hookName = hookMatch[1]!;
      const hookItems: unknown[] = [];
      i++;
      
      // Parse hook items (e.g., "    - run: ./script.sh")
      while (i < endIndex) {
        const itemLine = lines[i];
        if (!itemLine || !itemLine.startsWith('    ')) break;
        
        const itemMatch = itemLine.match(/^\s+-\s+(\w+):\s*(.+)$/);
        if (itemMatch) {
          hookItems.push({ [itemMatch[1]!]: itemMatch[2]! });
        }
        i++;
      }
      
      hooks[hookName] = hookItems;
      continue;
    }
    
    // If we hit a non-indented line, we're done with hooks
    if (!line.startsWith(' ')) {
      break;
    }
    i++;
  }
  
  return { hooks, nextIndex: i };
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
      frontmatter: {},
      body: content.trim(),
    };
  }
  
  const frontmatter: SkillFrontmatter = {};
  
  // Parse frontmatter lines
  let i = frontmatterStart + 1;
  while (i < frontmatterEnd) {
    const line = lines[i];
    if (!line) {
      i++;
      continue;
    }
    
    // Check for hooks: key (indicates skill-scoped hooks)
    if (line.match(/^hooks:\s*$/)) {
      i++;
      const { hooks, nextIndex } = parseHooksSection(lines, i, frontmatterEnd);
      frontmatter.hooks = hooks;
      i = nextIndex;
      continue;
    }
    
    // Parse description: "..."
    const descriptionMatch = line.match(/^description:\s*["']?(.+?)["']?\s*$/);
    if (descriptionMatch) {
      frontmatter.description = descriptionMatch[1];
      i++;
      continue;
    }
    
    // Parse name: "..."
    const nameMatch = line.match(/^name:\s*["']?(.+?)["']?\s*$/);
    if (nameMatch) {
      frontmatter.name = nameMatch[1];
      i++;
      continue;
    }

    // Parse disable-model-invocation: true
    const disableMatch = line.match(/^disable-model-invocation:\s*(true|false)\s*$/);
    if (disableMatch) {
      frontmatter.disableModelInvocation = disableMatch[1] === 'true';
      i++;
      continue;
    }
    
    i++;
  }
  
  // Extract body (everything after second ---)
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const body = bodyLines.join('\n').trim();
  
  return { frontmatter, body };
}

/**
 * Find all skill directories in .claude/skills/ that contain SKILL.md.
 * Returns directory names (e.g., "testing", "secure-deploy").
 */
async function findSkillDirs(root: string): Promise<string[]> {
  const results: string[] = [];
  const skillsDir = path.join(root, '.claude', 'skills');
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
        try {
          await fs.access(skillFile);
          results.push(entry.name);
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
 * Recursively read all non-SKILL.md files in a skill directory.
 * Returns a map of relative path → content (e.g., 'scripts/extract.py' → '...').
 * Supports AgentSkills.io subdirectories: scripts/, references/, assets/.
 */
async function readSkillFiles(skillDir: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  async function traverse(currentDir: string, relativePath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const entryRelPath = relativePath
          ? `${relativePath}/${entry.name}`
          : entry.name;
        const entryFullPath = path.join(currentDir, entry.name);
        if (entry.isFile() && entry.name !== 'SKILL.md') {
          files[entryRelPath] = await fs.readFile(entryFullPath, 'utf-8');
        } else if (entry.isDirectory()) {
          await traverse(entryFullPath, entryRelPath);
        }
      }
    } catch {
      // Directory read error - skip
    }
  }

  await traverse(skillDir, '');
  return files;
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
      version: CURRENT_IR_VERSION,
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
 * @param rootOrWorkspace - Root directory path or Workspace instance
 */
export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
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
        version: CURRENT_IR_VERSION,
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

  // Find all .claude/skills/*/ directories with SKILL.md (AgentSkill or AgentSkillIO)
  const skillDirs = await findSkillDirs(root);
  const skillsDir = path.join(root, '.claude', 'skills');

  for (const dirName of skillDirs) {
    const skillDir = path.join(skillsDir, dirName);
    const skillPath = `.claude/skills/${dirName}/SKILL.md`;
    const fullPath = path.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, body } = parseSkillFrontmatter(content);
      
      // Extract skill name from frontmatter or directory
      const skillName = frontmatter.name || dirName;
      
      // Read all other files in the skill directory
      const files = await readSkillFiles(skillDir);
      const hasExtraFiles = Object.keys(files).length > 0;
      const hasHooks = frontmatter.hooks && Object.keys(frontmatter.hooks).length > 0;
      
      // Classification priority:
      // 1. Has hooks → SKIP (hooks are not supported by AgentSkills.io)
      // 2. Has extra files → AgentSkillIO (with description required)
      // 3. disable-model-invocation: true → ManualPrompt
      // 4. description present → SimpleAgentSkill

      if (hasHooks) {
        // Skills with hooks are not supported - skip with warning
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${skillName}': Hooks are not supported by AgentSkills.io`,
          sources: [skillPath],
        });
        continue;
      }

      if (hasExtraFiles) {
        // AgentSkillIO - complex skill with resource files
        if (!frontmatter.description) {
          // AgentSkillIO requires description
          warnings.push({
            code: WarningCode.Skipped,
            message: `Skipped skill '${skillName}': Has resource files but missing description`,
            sources: [skillPath],
          });
          continue;
        }

        const agentSkillIO: AgentSkillIO = {
          id: createId(CustomizationType.AgentSkillIO, skillPath),
          type: CustomizationType.AgentSkillIO,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          name: skillName,
          description: frontmatter.description,
          disableModelInvocation: frontmatter.disableModelInvocation,
          resources: Object.keys(files),
          files,
          metadata: { name: frontmatter.name },
        };
        items.push(agentSkillIO);
      } else if (frontmatter.disableModelInvocation === true) {
        // ManualPrompt
        const prompt: ManualPrompt = {
          id: createId(CustomizationType.ManualPrompt, skillPath),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          promptName: skillName,
          metadata: {
            name: skillName,
          },
        };
        items.push(prompt);
      } else if (frontmatter.description) {
        // SimpleAgentSkill
        const skill: SimpleAgentSkill = {
          id: createId(CustomizationType.SimpleAgentSkill, skillPath),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          description: frontmatter.description,
          metadata: {
            name: skillName,
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

  // Find all .claude/rules/*.md files (Phase 8 A1)
  const ruleFiles = await findClaudeRules(root);
  
  for (const rulePath of ruleFiles) {
    const fullPath = path.join(root, rulePath);
    
    // Normalize path separators for cross-platform consistency
    const normalizedPath = rulePath.split(path.sep).join('/');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, body } = parseClaudeRuleFrontmatter(content);
      
      // Normalize paths to array
      let paths: string[] = [];
      if (frontmatter.paths) {
        if (typeof frontmatter.paths === 'string') {
          paths = [frontmatter.paths];
        } else if (Array.isArray(frontmatter.paths)) {
          paths = frontmatter.paths;
        }
      }
      
      // Compute relativeDir from subdirectory path under .claude/rules/
      // e.g., '.claude/rules/niko/Core/file-verification.md' → 'niko/Core'
      const ruleRelPath = normalizedPath.replace(/^\.claude\/rules\//, '');
      const ruleDir = path.posix.dirname(ruleRelPath);
      const relativeDir = ruleDir === '.' ? undefined : ruleDir;

      // Classification:
      // - No paths or empty paths -> GlobalPrompt
      // - paths present -> FileRule with globs
      if (paths.length === 0) {
        // GlobalPrompt
        items.push({
          id: createId(CustomizationType.GlobalPrompt, normalizedPath),
          type: CustomizationType.GlobalPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: normalizedPath,
          relativeDir,
          content: body,
          metadata: {
            nested: false,
            depth: 0,
            ...frontmatter,
          },
        });
      } else {
        // FileRule
        const fileRule: FileRule = {
          id: createId(CustomizationType.FileRule, normalizedPath),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          sourcePath: normalizedPath,
          relativeDir,
          content: body,
          globs: paths,
          metadata: {
            ...frontmatter,
          },
        };
        items.push(fileRule);
      }
      
    } catch (error) {
      warnings.push({
        code: WarningCode.Skipped,
        message: `Could not read ${rulePath}: ${(error as Error).message}`,
        sources: [rulePath],
      });
    }
  }

  return { items, warnings };
}
