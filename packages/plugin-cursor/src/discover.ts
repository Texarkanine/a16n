import * as fs from 'fs/promises';
import * as nodePath from 'path';
import matter from 'gray-matter';
import {
  type AgentCustomization,
  type AgentIgnore,
  type AgentSkillSpecFields,
  type ManualPrompt,
  type DiscoveryResult,
  type Warning,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type GlobalPrompt,
  type Workspace,
  CustomizationType,
  WarningCode,
  createId,
  extractSpecFields,
  inferGlobalPromptName,
  resolveRoot,
  CURRENT_IR_VERSION,
} from '@a16njs/models';
import { hasFrontmatterBlock, parseMdc, type MdcFrontmatter } from './mdc.js';

/**
 * Recursively find all .mdc files in a directory and its subdirectories.
 * Returns paths relative to the rulesDir (e.g., "shared/core.mdc").
 * 
 * NOTE: This only searches within the given rulesDir. Finding nested
 * .cursor/rules/ directories elsewhere in the project is a future enhancement.
 */
async function findMdcFiles(rulesDir: string, relativePath: string = ''): Promise<string[]> {
  const results: string[] = [];
  
  try {
    const entries = await fs.readdir(nodePath.join(rulesDir, relativePath), { withFileTypes: true });
    
    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isFile() && entry.name.endsWith('.mdc')) {
        results.push(entryRelativePath);
      } else if (entry.isDirectory()) {
        // Recurse into subdirectories
        const subFiles = await findMdcFiles(rulesDir, entryRelativePath);
        results.push(...subFiles);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return results;
}

/**
 * Parse comma-separated glob patterns into an array.
 * Handles various formats: "*.ts,*.tsx" or "*.ts, *.tsx"
 */
function parseGlobs(globsString: string): string[] {
  return globsString
    .split(',')
    .map(g => g.trim())
    .filter(g => g.length > 0);
}

/**
 * Coerce Cursor skill `paths:` (YAML list or comma-separated string) to globs.
 */
function coerceSkillPaths(raw: unknown): string[] {
  if (typeof raw === 'string') {
    return parseGlobs(raw);
  }
  if (Array.isArray(raw)) {
    return raw.filter((p): p is string => typeof p === 'string').map(p => p.trim()).filter(p => p.length > 0);
  }
  return [];
}

/**
 * Classify a Cursor rule based on its frontmatter.
 * 
 * Classification priority:
 * 1. alwaysApply: true → GlobalPrompt
 * 2. globs: present → FileRule
 * 3. description: present → AgentSkill
 * 4. None of above → ManualPrompt (agent-requestable, invoked via slash command)
 */
function classifyRule(
  frontmatter: MdcFrontmatter,
  body: string,
  sourcePath: string,
  relativeDir?: string,
): AgentCustomization {
  // Priority 1: alwaysApply: true → GlobalPrompt
  if (frontmatter.alwaysApply === true) {
    return {
      id: createId(CustomizationType.GlobalPrompt, sourcePath),
      type: CustomizationType.GlobalPrompt,
      version: CURRENT_IR_VERSION,
      sourcePath,
      relativeDir,
      name: inferGlobalPromptName(sourcePath),
      content: body,
      metadata: { ...frontmatter },
    } as GlobalPrompt;
  }

  // Priority 2: globs present AND non-empty → FileRule
  // Note: frontmatter.globs may be truthy (e.g., whitespace) but parse to empty array
  if (frontmatter.globs) {
    const globs = parseGlobs(frontmatter.globs);
    if (globs.length > 0) {
      return {
        id: createId(CustomizationType.FileRule, sourcePath),
        type: CustomizationType.FileRule,
        version: CURRENT_IR_VERSION,
        sourcePath,
        relativeDir,
        content: body,
        globs,
        metadata: { ...frontmatter },
      } as FileRule;
    }
    // Fall through to next priority if globs is empty after parsing
  }

  // Priority 3: description present → SimpleAgentSkill
  if (frontmatter.description) {
    const name = nodePath.basename(sourcePath, nodePath.extname(sourcePath));
    return {
      id: createId(CustomizationType.SimpleAgentSkill, sourcePath),
      type: CustomizationType.SimpleAgentSkill,
      version: CURRENT_IR_VERSION,
      sourcePath,
      relativeDir,
      content: body,
      name,
      description: frontmatter.description,
      metadata: { ...frontmatter },
    } as SimpleAgentSkill;
  }

  // Priority 4: No activation criteria → ManualPrompt (Phase 7)
  // Rules without alwaysApply: true, globs, or description are agent-requestable
  const promptName = nodePath.basename(sourcePath, nodePath.extname(sourcePath));
  return {
    id: createId(CustomizationType.ManualPrompt, sourcePath),
    type: CustomizationType.ManualPrompt,
    version: CURRENT_IR_VERSION,
    sourcePath,
    relativeDir,
    content: body,
    promptName,
    metadata: { ...frontmatter },
  } as ManualPrompt;
}

/**
 * Recursively find all .md files in .cursor/commands/ directory.
 * Returns paths relative to commandsDir (e.g., "frontend/component.md").
 */
async function findCommandFiles(commandsDir: string, relativePath: string = ''): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await fs.readdir(nodePath.join(commandsDir, relativePath), { withFileTypes: true });

    for (const entry of entries) {
      const entryRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(entryRelativePath);
      } else if (entry.isDirectory()) {
        const subFiles = await findCommandFiles(commandsDir, entryRelativePath);
        results.push(...subFiles);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return results;
}

/**
 * Discover commands from .cursor/commands/**\/*.md
 * - Every command → ManualPrompt, content stored as raw bytes
 * - Commands opening with a frontmatter block → advisory warning
 *
 * NON-ROUNDTRIP NOTE: Commands are discovered for legacy support only.
 * The emit side now produces Agent Skills (disable-model-invocation) instead of
 * Commands. This is an intentional discover/emit asymmetry (see systemPatterns.md).
 * A ManualPrompt discovered from Commands will be emitted as a Skill.
 */
async function discoverCommands(root: string): Promise<{
  items: ManualPrompt[];
  warnings: Warning[];
}> {
  const items: ManualPrompt[] = [];
  const warnings: Warning[] = [];

  const commandsDir = nodePath.join(root, '.cursor', 'commands');
  const commandFiles = await findCommandFiles(commandsDir);

  for (const file of commandFiles) {
    const filePath = nodePath.join(commandsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const sourcePath = `.cursor/commands/${file}`;

    // Preserve directory nesting via relativeDir to avoid name collisions
    // e.g., "foo/bar/baz.md" → promptName: "baz", relativeDir: "foo/bar"
    const promptName = nodePath.basename(file, '.md');

    // Cursor commands have no frontmatter concept: the filename is the command
    // name and the whole file is the prompt. A leading `---` block is therefore
    // content the author wrote, not configuration we can act on — so it is kept
    // verbatim and reported once rather than stripped or silently passed through.
    if (hasFrontmatterBlock(content)) {
      warnings.push({
        code: WarningCode.Approximated,
        message: `Command '${promptName}': Cursor commands do not support frontmatter; the leading block is preserved as body content`,
        sources: [sourcePath],
      });
    }

    const dir = nodePath.dirname(file);
    const relativeDir = dir === '.' ? undefined : dir.split(nodePath.sep).join('/');
    items.push({
      id: createId(CustomizationType.ManualPrompt, sourcePath),
      type: CustomizationType.ManualPrompt,
      version: CURRENT_IR_VERSION,
      sourcePath,
      relativeDir,
      content,
      promptName,
      metadata: {},
    });
  }

  return { items, warnings };
}

/**
 * Frontmatter fields a `.cursor/skills/*​/SKILL.md` can declare.
 *
 * Unlike `.mdc` rules, SKILL.md is standards-compliant YAML in both Cursor and
 * the AgentSkills.io spec, so it is parsed with a real YAML parser. `parseMdc()`
 * is deliberately NOT used here, and vice versa.
 */
interface SkillFrontmatter {
  name?: string;
  description?: string;
  disableModelInvocation?: boolean;
  /**
   * True when Cursor's harness-specific `paths:` key is declared (even if empty).
   * Bare skills with non-empty paths become FileRules; otherwise discovery refuses
   * rather than widen scope (#148).
   */
  hasPaths?: boolean;
  /** Normalised `paths:` globs when `hasPaths` is true. */
  paths?: string[];
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter;
  /** Optional AgentSkills.io spec fields, carried straight onto the emitted item. */
  specFields: AgentSkillSpecFields;
  body: string;
  parseError?: string;
}

/**
 * Parse YAML frontmatter from a SKILL.md file via gray-matter.
 *
 * @param content - The complete SKILL.md file content
 * @returns The recognized frontmatter fields, the body, and a parse error if
 *   the frontmatter is not valid YAML
 */
function parseSkillFrontmatter(content: string): ParsedSkill {
  try {
    const parsed = matter(content);
    const data: Record<string, unknown> = parsed.data ?? {};
    const frontmatter: SkillFrontmatter = {};

    if (typeof data.name === 'string') frontmatter.name = data.name;
    if (typeof data.description === 'string') frontmatter.description = data.description;
    if (typeof data['disable-model-invocation'] === 'boolean') {
      frontmatter.disableModelInvocation = data['disable-model-invocation'];
    }
    if ('paths' in data) {
      frontmatter.hasPaths = true;
      frontmatter.paths = coerceSkillPaths(data.paths);
    }

    return {
      frontmatter,
      specFields: extractSpecFields(data),
      body: parsed.content.trim(),
    };
  } catch (err) {
    return {
      frontmatter: {},
      specFields: {},
      body: content.trim(),
      parseError: err instanceof Error ? err.message : String(err),
    };
  }
}

interface SkillDirInfo {
  /** Path relative to .cursor/skills/ (e.g., "banana" or "veggies/tomato") */
  relativePath: string;
  /** Invocation name: immediately-containing directory name (e.g., "banana" or "tomato") */
  dirName: string;
}

/**
 * Recursively find all skill directories in .cursor/skills/ that contain SKILL.md.
 *
 * If a directory contains SKILL.md, it is a skill and its subdirectories are
 * treated as resources (not recursed for more skills). If a directory does NOT
 * contain SKILL.md, it is a category directory and is recursed.
 */
async function findSkillDirs(root: string): Promise<SkillDirInfo[]> {
  const results: SkillDirInfo[] = [];
  const skillsDir = nodePath.join(root, '.cursor', 'skills');

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
      const fullPath = nodePath.join(currentDir, entry.name);
      const skillFile = nodePath.join(fullPath, 'SKILL.md');

      try {
        await fs.access(skillFile);
        results.push({ relativePath: entryRelPath, dirName: entry.name });
      } catch {
        // No SKILL.md — treat as category directory, recurse
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
        const entryFullPath = nodePath.join(currentDir, entry.name);
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
 * Discover skills from .cursor/skills/.
 *
 * Classification:
 * - Extra files + `paths:` → SKIP (ride-alongs cannot become a FileRule; dropping paths widens scope)
 * - Extra files → AgentSkillIO
 * - `paths:` + disable-model-invocation → SKIP (slash-only is not a FileRule)
 * - `paths:` with non-empty globs → FileRule (same scoping as a globbed rule)
 * - Empty `paths:` → SKIP
 * - disable-model-invocation: true → ManualPrompt
 * - description only → SimpleAgentSkill
 * - Otherwise → Skip with warning
 */
async function discoverSkills(root: string): Promise<{
  items: AgentCustomization[];
  warnings: Warning[];
}> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];
  
  const skillDirs = await findSkillDirs(root);
  const skillsDir = nodePath.join(root, '.cursor', 'skills');
  
  for (const { relativePath, dirName } of skillDirs) {
    const skillDir = nodePath.join(skillsDir, relativePath);
    const skillPath = `.cursor/skills/${relativePath}/SKILL.md`;
    const fullPath = nodePath.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, specFields, body, parseError } = parseSkillFrontmatter(content);

      if (parseError) {
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${dirName}': Invalid frontmatter: ${parseError}`,
          sources: [skillPath],
        });
        continue;
      }

      // Display name from frontmatter; invocation name is always the dirName
      const displayName = frontmatter.name?.trim() || dirName;
      
      // Read all other files in the skill directory
      const files = await readSkillFiles(skillDir);
      const hasExtraFiles = Object.keys(files).length > 0;
      const paths = frontmatter.paths ?? [];

      if (hasExtraFiles) {
        // AgentSkillIO cannot express `paths:` — refuse rather than widen.
        if (frontmatter.hasPaths) {
          warnings.push({
            code: WarningCode.Skipped,
            message:
              `Skipped skill '${displayName}': Cursor paths: scoping cannot be preserved ` +
              `on a skill with resource files; converting would widen skill scope`,
            sources: [skillPath],
          });
          continue;
        }

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
          ...specFields,
        };
        items.push(agentSkillIO);
      } else if (frontmatter.hasPaths) {
        // Bare skill + paths ≡ globbed FileRule. Slash-only cannot make that jump.
        if (frontmatter.disableModelInvocation === true) {
          warnings.push({
            code: WarningCode.Skipped,
            message:
              `Skipped skill '${displayName}': Cursor paths: with disable-model-invocation ` +
              `cannot become a FileRule without changing invocation semantics`,
            sources: [skillPath],
          });
          continue;
        }
        if (paths.length === 0) {
          warnings.push({
            code: WarningCode.Skipped,
            message:
              `Skipped skill '${displayName}': Cursor paths: is empty; ` +
              `converting would widen skill scope`,
            sources: [skillPath],
          });
          continue;
        }

        const fileRule: FileRule = {
          id: createId(CustomizationType.FileRule, skillPath),
          type: CustomizationType.FileRule,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          globs: paths,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
        };
        items.push(fileRule);
      } else if (frontmatter.disableModelInvocation === true) {
        // ManualPrompt
        items.push({
          id: createId(CustomizationType.ManualPrompt, skillPath),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          promptName: dirName,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
          ...specFields,
        } as ManualPrompt);
      } else if (frontmatter.description) {
        // SimpleAgentSkill — dirName is the invocation name
        items.push({
          id: createId(CustomizationType.SimpleAgentSkill, skillPath),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          name: dirName,
          description: frontmatter.description,
          metadata: frontmatter.name !== undefined ? { name: frontmatter.name } : {},
          ...specFields,
        } as SimpleAgentSkill);
      } else {
        // Skip with warning
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
  
  return { items, warnings };
}

/**
 * Discover .cursorignore file and parse its patterns.
 * Returns null if file doesn't exist or has no valid patterns.
 */
async function discoverCursorIgnore(root: string): Promise<AgentIgnore | null> {
  const ignorePath = nodePath.join(root, '.cursorignore');

  try {
    const content = await fs.readFile(ignorePath, 'utf-8');
    const patterns = content
      .split(/\r?\n/)
      .map(line => line.trimEnd())
      .filter(line => {
        const trimmedStart = line.trimStart();
        return trimmedStart.length > 0 && !trimmedStart.startsWith('#');
      })
      .map(line => {
        // Strip inline comments (unescaped ' #')
        const inlineCommentIndex = line.indexOf(' #');
        const cleaned = inlineCommentIndex >= 0 ? line.slice(0, inlineCommentIndex) : line;
        return cleaned.trimEnd();
      })
      .filter(line => line.length > 0);

    if (patterns.length === 0) return null;

    return {
      id: createId(CustomizationType.AgentIgnore, '.cursorignore'),
      type: CustomizationType.AgentIgnore,
      version: CURRENT_IR_VERSION,
      sourcePath: '.cursorignore',
      content,
      patterns,
      metadata: {},
    };
  } catch {
    return null;
  }
}

/**
 * Discover all Cursor rules in a project directory.
 * @param rootOrWorkspace - Root directory path or Workspace instance
 */
export async function discover(rootOrWorkspace: string | Workspace): Promise<DiscoveryResult> {
  const root = resolveRoot(rootOrWorkspace);
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];

  // Find .cursor/rules/*.mdc files
  const rulesDir = nodePath.join(root, '.cursor', 'rules');
  const mdcFiles = await findMdcFiles(rulesDir);

  for (const file of mdcFiles) {
    const filePath = nodePath.join(rulesDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMdc(content);

    // Classify and add all rules (Phase 2: supports GlobalPrompt, FileRule, AgentSkill)
    const sourcePath = `.cursor/rules/${file}`;
    // Compute relativeDir from subdirectory path (e.g., 'shared/niko/Core' for 'shared/niko/Core/file.mdc')
    const dir = nodePath.dirname(file);
    const relativeDir = dir === '.' ? undefined : dir.split(nodePath.sep).join('/');
    const item = classifyRule(frontmatter, body, sourcePath, relativeDir);
    items.push(item);
  }

  // Discover commands from .cursor/commands/ (Phase 4)
  const commandResult = await discoverCommands(root);
  items.push(...commandResult.items);
  warnings.push(...commandResult.warnings);

  // Discover skills from .cursor/skills/ (Phase 7)
  const skillResult = await discoverSkills(root);
  items.push(...skillResult.items);
  warnings.push(...skillResult.warnings);

  // Discover .cursorignore (Phase 3)
  const agentIgnore = await discoverCursorIgnore(root);
  if (agentIgnore) {
    items.push(agentIgnore);
  }

  return { items, warnings };
}
