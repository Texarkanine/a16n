import matter from 'gray-matter';
import {
  type AgentCustomization,
  type GlobalPrompt,
  type FileRule,
  type SimpleAgentSkill,
  type ManualPrompt,
  type AgentIgnore,
  type IRVersion,
  type Workspace,
  CustomizationType,
  createId,
  parseIRVersion,
  toWorkspace,
} from '@a16njs/models';

/**
 * Result of parsing an IR file.
 * Either returns a parsed item or an error message.
 */
export interface ParseIRFileResult {
  item?: AgentCustomization;
  error?: string;
}

/**
 * Frontmatter structure for IR files.
 * Contains version, type, and type-specific fields.
 */
interface IRFrontmatter {
  version?: string;
  type?: string;
  relativeDir?: string;
  // Type-specific fields
  name?: string;
  globs?: string[];
  description?: string;
  patterns?: string[];
  [key: string]: unknown;
}

/**
 * Parse an IR file from a workspace.
 *
 * @param rootOrWorkspace - Workspace or root path string
 * @param filePath - Path to the file relative to workspace root
 * @param filename - Filename (used to derive name)
 * @param sourcePath - Path relative to .a16n/ directory (e.g., ".a16n/global-prompt/coding-standards.md")
 * @returns ParseIRFileResult with either item or error
 */
export async function parseIRFile(
  rootOrWorkspace: string | Workspace,
  filePath: string,
  filename: string,
  sourcePath: string
): Promise<ParseIRFileResult> {
  try {
    const ws = toWorkspace(rootOrWorkspace);
    // Read file content
    const content = await ws.read(filePath);
    
    // Parse YAML frontmatter
    let parsed: ReturnType<typeof matter>;
    try {
      parsed = matter(content);
    } catch (err) {
      return { error: `Failed to parse YAML frontmatter: ${(err as Error).message}` };
    }
    
    const frontmatter = parsed.data as IRFrontmatter;
    const body = parsed.content;
    
    // Validate required fields
    if (!frontmatter.version) {
      return { error: 'Missing required field: version' };
    }
    
    if (!frontmatter.type) {
      return { error: 'Missing required field: type' };
    }
    
    // Validate version format
    const versionParsed = parseIRVersion(frontmatter.version);
    if (!versionParsed) {
      return { error: `Invalid version format: ${frontmatter.version}` };
    }
    
    // Validate type
    const type = frontmatter.type as CustomizationType;
    if (!Object.values(CustomizationType).includes(type)) {
      return { error: `Invalid type: ${frontmatter.type}` };
    }
    
    // Extract name from filename (without extension)
    const nameWithoutExt = filename.replace(/\.[^.]+$/, '');
    
    // Build base IR item
    // metadata is NOT serialized to IR files (transient only), so initialize as empty
    const baseItem = {
      id: createId(type, sourcePath),
      type,
      version: frontmatter.version as IRVersion,
      sourcePath,
      content: body,
      relativeDir: frontmatter.relativeDir,
      metadata: {},
    };
    
    // Handle type-specific fields
    switch (type) {
      case CustomizationType.GlobalPrompt: {
        const item: GlobalPrompt = {
          ...baseItem,
          type: CustomizationType.GlobalPrompt,
        };
        return { item };
      }
      
      case CustomizationType.FileRule: {
        if (!frontmatter.globs || !Array.isArray(frontmatter.globs)) {
          return { error: 'FileRule requires globs array in frontmatter' };
        }
        const item: FileRule = {
          ...baseItem,
          type: CustomizationType.FileRule,
          globs: frontmatter.globs,
        };
        return { item };
      }
      
      case CustomizationType.SimpleAgentSkill: {
        if (!frontmatter.description || typeof frontmatter.description !== 'string') {
          return { error: 'SimpleAgentSkill requires description string in frontmatter' };
        }
        // v1beta2 requires name in frontmatter; v1beta1 files may omit it — derive from filename
        const name =
          typeof frontmatter.name === 'string' && frontmatter.name.trim().length > 0
            ? frontmatter.name.trim()
            : nameWithoutExt;
        const item: SimpleAgentSkill = {
          ...baseItem,
          type: CustomizationType.SimpleAgentSkill,
          name,
          description: frontmatter.description,
        };
        return { item };
      }
      
      case CustomizationType.ManualPrompt: {
        // Derive promptName from relativeDir + filename
        const promptName = frontmatter.relativeDir
          ? `${frontmatter.relativeDir}/${nameWithoutExt}`
          : nameWithoutExt;
        
        const item: ManualPrompt = {
          ...baseItem,
          type: CustomizationType.ManualPrompt,
          promptName,
        };
        return { item };
      }
      
      case CustomizationType.AgentIgnore: {
        if (!frontmatter.patterns || !Array.isArray(frontmatter.patterns)) {
          return { error: 'AgentIgnore requires patterns array in frontmatter' };
        }
        const item: AgentIgnore = {
          ...baseItem,
          type: CustomizationType.AgentIgnore,
          patterns: frontmatter.patterns,
        };
        return { item };
      }
      
      case CustomizationType.AgentSkillIO:
        // AgentSkillIO uses verbatim AgentSkills.io format (NO IR frontmatter)
        // This should be handled by readAgentSkillIO from @a16njs/models
        return { error: 'AgentSkillIO should be parsed using readAgentSkillIO()' };
      
      default:
        return { error: `Unsupported type: ${type}` };
    }
  } catch (err) {
    return { error: `Failed to read file: ${(err as Error).message}` };
  }
}
