import * as fs from 'fs/promises';
import * as path from 'path';
import {
  type AgentCustomization,
  type AgentIgnore,
  type AgentCommand,
  type DiscoveryResult,
  type Warning,
  type FileRule,
  type AgentSkill,
  type GlobalPrompt,
  CustomizationType,
  WarningCode,
  createId,
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
    const entries = await fs.readdir(path.join(rulesDir, relativePath), { withFileTypes: true });
    
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
 * 4. None of above → GlobalPrompt (fallback)
 */
function classifyRule(
  frontmatter: MdcFrontmatter,
  body: string,
  sourcePath: string
): AgentCustomization {
  // Priority 1: alwaysApply: true → GlobalPrompt
  if (frontmatter.alwaysApply === true) {
    return {
      id: createId(CustomizationType.GlobalPrompt, sourcePath),
      type: CustomizationType.GlobalPrompt,
      sourcePath,
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
        sourcePath,
        content: body,
        globs,
        metadata: { ...frontmatter },
      } as FileRule;
    }
    // Fall through to next priority if globs is empty after parsing
  }

  // Priority 3: description present → AgentSkill
  if (frontmatter.description) {
    return {
      id: createId(CustomizationType.AgentSkill, sourcePath),
      type: CustomizationType.AgentSkill,
      sourcePath,
      content: body,
      description: frontmatter.description,
      metadata: { ...frontmatter },
    } as AgentSkill;
  }

  // Priority 4: Fallback → GlobalPrompt
  return {
    id: createId(CustomizationType.GlobalPrompt, sourcePath),
    type: CustomizationType.GlobalPrompt,
    sourcePath,
    content: body,
    metadata: { ...frontmatter },
  } as GlobalPrompt;
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
    const entries = await fs.readdir(path.join(commandsDir, relativePath), { withFileTypes: true });

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
 * - Simple commands → AgentCommand
 * - Complex commands → Skip with warning
 */
async function discoverCommands(root: string): Promise<{
  items: AgentCommand[];
  warnings: Warning[];
}> {
  const items: AgentCommand[] = [];
  const warnings: Warning[] = [];

  const commandsDir = path.join(root, '.cursor', 'commands');
  const commandFiles = await findCommandFiles(commandsDir);

  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const sourcePath = `.cursor/commands/${file}`;

    // Check for complex features
    const { isComplex, reasons } = isComplexCommand(content);

    if (isComplex) {
      // Extract command name for warning message
      const commandName = path.basename(file, '.md');
      warnings.push({
        code: WarningCode.Skipped,
        message: `Skipped command '${commandName}': Contains ${reasons.join(', ')} (not convertible to Claude)`,
        sources: [sourcePath],
      });
      continue;
    }

    // Simple command - create AgentCommand
    const commandName = path.basename(file, '.md');
    items.push({
      id: createId(CustomizationType.AgentCommand, sourcePath),
      type: CustomizationType.AgentCommand,
      sourcePath,
      content,
      commandName,
      metadata: {},
    });
  }

  return { items, warnings };
}

/**
 * Discover .cursorignore file and parse its patterns.
 * Returns null if file doesn't exist or has no valid patterns.
 */
async function discoverCursorIgnore(root: string): Promise<AgentIgnore | null> {
  const ignorePath = path.join(root, '.cursorignore');

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
  const rulesDir = path.join(root, '.cursor', 'rules');
  const mdcFiles = await findMdcFiles(rulesDir);

  for (const file of mdcFiles) {
    const filePath = path.join(rulesDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMdc(content);

    // Classify and add all rules (Phase 2: supports GlobalPrompt, FileRule, AgentSkill)
    const sourcePath = `.cursor/rules/${file}`;
    const item = classifyRule(frontmatter, body, sourcePath);
    items.push(item);
  }

  // Discover commands from .cursor/commands/ (Phase 4)
  const commandResult = await discoverCommands(root);
  items.push(...commandResult.items);
  warnings.push(...commandResult.warnings);

  // Discover .cursorignore (Phase 3)
  const agentIgnore = await discoverCursorIgnore(root);
  if (agentIgnore) {
    items.push(agentIgnore);
  }

  return { items, warnings };
}
