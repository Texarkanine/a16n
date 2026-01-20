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
