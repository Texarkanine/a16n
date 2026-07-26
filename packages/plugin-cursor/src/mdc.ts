/**
 * MDC (Markdown Configuration) parsing utilities.
 * Uses regex-based line parsing instead of YAML to avoid parsing issues
 * with Cursor's non-standard frontmatter format.
 */

export interface MdcFrontmatter {
  alwaysApply?: boolean;
  description?: string;
  globs?: string;
}

export interface ParsedMdc {
  frontmatter: MdcFrontmatter;
  body: string;
}

/**
 * Report whether content opens with a YAML frontmatter block.
 *
 * Requires all three of: a leading `---`, a later closing `---`, and at least
 * one YAML-ish key line between them. The key-line requirement keeps markdown
 * thematic breaks — which are valid prose, not configuration — from matching.
 *
 * "At least one" rather than "every" line, because frontmatter values routinely
 * span lines — `allowed-tools:` as a list, block scalars, nested maps — and
 * demanding that every line look like a key would miss them. The accepted cost is
 * an over-report on prose that happens to parse as YAML, such as a lone `Note:`
 * between two breaks. That direction is deliberate: a spurious advisory costs one
 * line and never touches content, while a miss restores the silent passthrough
 * this advisory exists to break.
 */
export function hasFrontmatterBlock(content: string): boolean {
  const lines = content.split('\n');
  const open = lines.findIndex(line => line.trim() !== '');
  if (open === -1 || lines[open]!.trim() !== '---') return false;

  const close = lines.findIndex((line, i) => i > open && line.trim() === '---');
  if (close === -1) return false;

  return lines.slice(open + 1, close).some(line => /^[A-Za-z_][\w-]*\s*:/.test(line));
}

/**
 * Parse MDC file content into frontmatter and body.
 * Uses line-by-line regex parsing for safety with Cursor's format.
 */
export function parseMdc(content: string): ParsedMdc {
  const frontmatter: MdcFrontmatter = {};
  
  // Check for frontmatter delimiters
  const lines = content.split('\n');
  
  // Find frontmatter boundaries
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
  
  // Parse frontmatter lines with regex
  for (let i = frontmatterStart + 1; i < frontmatterEnd; i++) {
    const line = lines[i];
    if (!line) continue;
    
    // Parse alwaysApply: true/false
    const alwaysApplyMatch = line.match(/^alwaysApply:\s*(true|false)\s*$/);
    if (alwaysApplyMatch) {
      frontmatter.alwaysApply = alwaysApplyMatch[1] === 'true';
      continue;
    }
    
    // Parse description: "..."
    const descriptionMatch = line.match(/^description:\s*["']?(.+?)["']?\s*$/);
    if (descriptionMatch) {
      frontmatter.description = descriptionMatch[1];
      continue;
    }
    
    // Parse globs: <pattern> (Cursor uses comma-separated string, not YAML array)
    const globsMatch = line.match(/^globs:\s*(.+)\s*$/);
    if (globsMatch) {
      frontmatter.globs = globsMatch[1];
      continue;
    }
  }
  
  // Extract body (everything after second ---)
  const bodyLines = lines.slice(frontmatterEnd + 1);
  const body = bodyLines.join('\n').trim();
  
  return { frontmatter, body };
}
