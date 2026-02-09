import * as fs from 'fs/promises';
import * as nodePath from 'path';
import {
  type AgentCustomization,
  type AgentIgnore,
  type ManualPrompt,
  type DiscoveryResult,
  type Warning,
  type FileRule,
  type SimpleAgentSkill,
  type AgentSkillIO,
  type GlobalPrompt,
  CustomizationType,
  WarningCode,
  createId,
  CURRENT_IR_VERSION,
} from '@a16njs/models';
import { parseMdc, type MdcFrontmatter } from './mdc.js';

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
    return {
      id: createId(CustomizationType.SimpleAgentSkill, sourcePath),
      type: CustomizationType.SimpleAgentSkill,
      version: CURRENT_IR_VERSION,
      sourcePath,
      relativeDir,
      content: body,
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
 * Patterns for detecting complex command features that cannot be converted to Claude.
 */
const COMPLEX_COMMAND_PATTERNS = {
  /** $ARGUMENTS or positional parameters like $1, $2, etc. */
  arguments: /\$ARGUMENTS|\$[1-9]/,
  /** Bash execution syntax: !`command` */
  bashExecution: /!\s*`[^`]+`/,
  /** File references like @src/utils.js */
  fileRefs: /@\S+/,
  /** allowed-tools in YAML frontmatter */
  allowedTools: /^---[\s\S]*?allowed-tools:/m,
};

/**
 * Check if a command contains complex features that cannot be converted.
 * Returns an object with isComplex flag and list of reasons.
 */
function isComplexCommand(content: string): { isComplex: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (COMPLEX_COMMAND_PATTERNS.arguments.test(content)) {
    reasons.push('$ARGUMENTS or positional parameters');
  }
  if (COMPLEX_COMMAND_PATTERNS.bashExecution.test(content)) {
    reasons.push('bash execution (!)');
  }
  if (COMPLEX_COMMAND_PATTERNS.fileRefs.test(content)) {
    reasons.push('file references (@)');
  }
  if (COMPLEX_COMMAND_PATTERNS.allowedTools.test(content)) {
    reasons.push('allowed-tools frontmatter');
  }

  return { isComplex: reasons.length > 0, reasons };
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
 * - Simple commands → ManualPrompt
 * - Complex commands → Skip with warning
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

    // Check for complex features
    const { isComplex, reasons } = isComplexCommand(content);

    if (isComplex) {
      // Extract prompt name for warning message
      const promptName = nodePath.basename(file, '.md');
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped command '${promptName}': Contains ${reasons.join(', ')} (not convertible to Claude)`,
        sources: [sourcePath],
      });
      continue;
    }

    // Simple command - create ManualPrompt
    // Preserve directory nesting via relativeDir to avoid name collisions
    // e.g., "foo/bar/baz.md" → promptName: "baz", relativeDir: "foo/bar"
    const promptName = nodePath.basename(file, '.md');
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
 * Parse YAML-like frontmatter from a SKILL.md file.
 * Returns the frontmatter key-values and body content.
 */
interface SkillFrontmatter {
  name?: string;
  description?: string;
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
      frontmatter: {},
      body: content.trim(),
    };
  }
  
  const frontmatter: SkillFrontmatter = {};
  
  // Parse frontmatter lines
  for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Parse disable-model-invocation: true
    const disableMatch = line.match(/^disable-model-invocation:\s*(true|false)\s*$/);
    if (disableMatch) {
      frontmatter.disableModelInvocation = disableMatch[1] === 'true';
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
  }
  
  // Extract body (everything after second ---)
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const body = bodyLines.join('\n').trim();
  
  return { frontmatter, body };
}

/**
 * Find all skill directories in .cursor/skills/ that contain SKILL.md.
 * Returns directory names (e.g., "deploy", "reset-db").
 */
async function findSkillDirs(root: string): Promise<string[]> {
  const results: string[] = [];
  const skillsDir = nodePath.join(root, '.cursor', 'skills');
  
  try {
    const entries = await fs.readdir(skillsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillFile = nodePath.join(skillsDir, entry.name, 'SKILL.md');
        try {
          await fs.access(skillFile);
          results.push(entry.name);
        } catch {
          // No SKILL.md in this directory
        }
      }
    }
  } catch {
    // .cursor/skills doesn't exist
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
 * - Skills with extra files -> AgentSkillIO (Phase 8 B3)
 * - Skills with disable-model-invocation: true -> ManualPrompt
 * - Skills with description only -> SimpleAgentSkill
 * - Skills without description or disable-model-invocation -> Skip with warning
 */
async function discoverSkills(root: string): Promise<{
  items: AgentCustomization[];
  warnings: Warning[];
}> {
  const items: AgentCustomization[] = [];
  const warnings: Warning[] = [];
  
  const skillDirs = await findSkillDirs(root);
  const skillsDir = nodePath.join(root, '.cursor', 'skills');
  
  for (const dirName of skillDirs) {
    const skillDir = nodePath.join(skillsDir, dirName);
    const skillPath = `.cursor/skills/${dirName}/SKILL.md`;
    const fullPath = nodePath.join(skillDir, 'SKILL.md');
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const { frontmatter, body } = parseSkillFrontmatter(content);
      
      // Extract skill name from frontmatter or directory
      const skillName = frontmatter.name || dirName;
      
      // Read all other files in the skill directory
      const files = await readSkillFiles(skillDir);
      const hasExtraFiles = Object.keys(files).length > 0;
      
      // Classification priority:
      // 1. Has extra files → AgentSkillIO (with description required)
      // 2. disable-model-invocation: true → ManualPrompt
      // 3. description present → SimpleAgentSkill
      // 4. Neither → Skip with warning
      
      if (hasExtraFiles) {
        // AgentSkillIO - complex skill with resources
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
        items.push({
          id: createId(CustomizationType.ManualPrompt, skillPath),
          type: CustomizationType.ManualPrompt,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          promptName: skillName,
          metadata: { name: frontmatter.name },
        } as ManualPrompt);
      } else if (frontmatter.description) {
        // SimpleAgentSkill
        items.push({
          id: createId(CustomizationType.SimpleAgentSkill, skillPath),
          type: CustomizationType.SimpleAgentSkill,
          version: CURRENT_IR_VERSION,
          sourcePath: skillPath,
          content: body,
          description: frontmatter.description,
          metadata: { name: frontmatter.name },
        } as SimpleAgentSkill);
      } else {
        // Skip with warning
        warnings.push({
          code: WarningCode.Skipped,
          message: `Skipped skill '${skillName}': Missing description or disable-model-invocation (not convertible)`,
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
 */
export async function discover(root: string): Promise<DiscoveryResult> {
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
