import * as fs from 'fs/promises';
import * as path from 'path';
import matter from 'gray-matter';
import {
  type AgentCustomization,
  type AgentIgnore,
  type GlobalPrompt,
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
  inferGlobalPromptName,
} from '@a16njs/models';

/**
 * Frontmatter structure for Claude rules files.
 * Contains paths field for conditional file-based activation.
 * After parseClaudeRuleFrontmatter, paths is always string[] when present.
 */
interface ClaudeRuleFrontmatter {
  paths?: string[];
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
 * Uses gray-matter for standards-compliant YAML (multi-line, quoted, comments, nested).
 *
 * @param content - Full file content including frontmatter
 * @returns Parsed frontmatter and body content
 */
function parseClaudeRuleFrontmatter(content: string): ParsedClaudeRule {
  try {
    const parsed = matter(content);
    const data = parsed.data as Record<string, unknown> | undefined;
    const frontmatter: ClaudeRuleFrontmatter = data ? { ...data } : {};

    // Normalize paths to array
    if (frontmatter.paths !== undefined) {
      const raw = frontmatter.paths;
      if (typeof raw === 'string') {
        frontmatter.paths = [raw];
      } else if (Array.isArray(raw)) {
        frontmatter.paths = raw.filter((p): p is string => typeof p === 'string');
      } else {
        frontmatter.paths = [];
      }
    }

    return {
      frontmatter,
      body: parsed.content.trim(),
    };
  } catch {
    // No valid frontmatter or parse error: treat whole content as body
    return {
      frontmatter: {},
      body: content.trim(),
    };
  }
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
 * Parse YAML frontmatter from a SKILL.md file.
 * Uses gray-matter for standards-compliant YAML (multi-line, quoted, comments, nested hooks).
 */
interface SkillFrontmatter {
  description?: string;
  name?: string;
  hooks?: Record<string, unknown>;
  /** True when the hooks key is present in frontmatter (even if empty). Used to skip skills. */
  hasHooks?: boolean;
  disableModelInvocation?: boolean;
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  body: string;
}

function parseSkillFrontmatter(content: string): ParsedSkill {
  try {
    const parsed = matter(content);
    const data = parsed.data as Record<string, unknown> | undefined;
    const frontmatter: SkillFrontmatter = {};

    if (data) {
      if (typeof data.name === 'string') frontmatter.name = data.name;
      if (typeof data.description === 'string') frontmatter.description = data.description;
      if (typeof data['disable-model-invocation'] === 'boolean') {
        frontmatter.disableModelInvocation = data['disable-model-invocation'];
      }
      if (Object.prototype.hasOwnProperty.call(data, 'hooks')) {
        frontmatter.hasHooks = true;
        if (data.hooks !== undefined && typeof data.hooks === 'object' && data.hooks !== null && !Array.isArray(data.hooks)) {
          frontmatter.hooks = data.hooks as Record<string, unknown>;
        }
      }
    }

    return {
      frontmatter,
      body: parsed.content.trim(),
    };
  } catch {
    return {
      frontmatter: {},
      body: content.trim(),
    };
  }
}

interface SkillDirInfo {
  /** Path relative to .claude/skills/ (e.g., "banana" or "category/tomato") */
  relativePath: string;
  /** Invocation name: immediately-containing directory name */
  dirName: string;
}

/**
 * Recursively find all skill directories in .claude/skills/ that contain SKILL.md.
 *
 * If a directory contains SKILL.md, it is a skill and its subdirectories are
 * treated as resources (not recursed for more skills). If a directory does NOT
 * contain SKILL.md, it is a category directory and is recursed.
 */
async function findSkillDirs(root: string): Promise<SkillDirInfo[]> {
  const results: SkillDirInfo[] = [];
  const skillsDir = path.join(root, '.claude', 'skills');

  async function traverse(currentDir: string, relativePath: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const entryRelPath = relativePath
        ? `${relativePath}/${entry.name}`
        : entry.name;
      const fullPath = path.join(currentDir, entry.name);
      const skillFile = path.join(fullPath, 'SKILL.md');

      try {
        await fs.access(skillFile);
        results.push({ relativePath: entryRelPath, dirName: entry.name });
      } catch {
        await traverse(fullPath, entryRelPath);
      }
    }
  }

  await traverse(skillsDir, '');
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
        name: inferGlobalPromptName(normalizedPath),
        content,
        metadata: {
          nested: isNested,
          depth,
        },
      } as GlobalPrompt);
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

  for (const { relativePath, dirName } of skillDirs) {
    const skillDir = path.join(skillsDir, relativePath);
    const skillPath = `.claude/skills/${relativePath}/SKILL.md`;
    const fullPath = path.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, body } = parseSkillFrontmatter(content);
      
      const displayName = frontmatter.name || dirName;
      
      // Read all other files in the skill directory
      const files = await readSkillFiles(skillDir);
      const hasExtraFiles = Object.keys(files).length > 0;
      const hasHooks = frontmatter.hasHooks === true;

      // Classification priority:
      // 1. Has hooks → SKIP (hooks are not supported by AgentSkills.io)
      // 2. Has extra files → AgentSkillIO (with description required)
      // 3. disable-model-invocation: true → ManualPrompt
      // 4. description present → SimpleAgentSkill

      if (hasHooks) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${displayName}': Hooks are not supported by AgentSkills.io`,
          sources: [skillPath],
        });
        continue;
      }

      if (hasExtraFiles) {
        if (!frontmatter.description) {
          warnings.push({
            code: WarningCode.Skipped,
            message: `Skipped skill '${displayName}': Has resource files but missing description`,
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
          name: dirName,
          description: frontmatter.description,
          disableModelInvocation: frontmatter.disableModelInvocation,
          resources: Object.keys(files),
          files,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
        };
        items.push(agentSkillIO);
      } else if (frontmatter.disableModelInvocation === true) {
        const prompt: ManualPrompt = {
          id: createId(CustomizationType.ManualPrompt, skillPath),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          promptName: dirName,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
        };
        items.push(prompt);
      } else if (frontmatter.description) {
        const skill: SimpleAgentSkill = {
          id: createId(CustomizationType.SimpleAgentSkill, skillPath),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          name: dirName,
          description: frontmatter.description,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
        };
        items.push(skill);
      } else {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${displayName}': Missing required description field`,
          sources: [skillPath],
        });
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

      const paths = frontmatter.paths ?? [];

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
          name: inferGlobalPromptName(normalizedPath),
          content: body,
          metadata: {
            nested: false,
            depth: 0,
            ...frontmatter,
          },
        } as GlobalPrompt);
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
