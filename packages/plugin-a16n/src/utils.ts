import * as path from 'path';

/**
 * Extract relative directory from a full path relative to base directory.
 * 
 * Example:
 * - extractRelativeDir('.a16n/global-prompt/coding-standards.md', '.a16n') -> undefined
 * - extractRelativeDir('.a16n/global-prompt/shared/company/standards.md', '.a16n/global-prompt') -> 'shared/company'
 * 
 * @param fullPath - Full path to the file
 * @param baseDir - Base directory to extract relative path from
 * @returns Relative directory or undefined if file is directly in baseDir
 */
export function extractRelativeDir(fullPath: string, baseDir: string): string | undefined {
  const normalized = path.normalize(fullPath);
  const normalizedBase = path.normalize(baseDir);
  
  // Get the directory containing the file
  const fileDir = path.dirname(normalized);
  
  // Get relative path from base to file directory
  const relative = path.relative(normalizedBase, fileDir);
  
  // If relative path is empty or goes up directories (..), return undefined
  if (!relative || relative === '.' || relative.startsWith('..')) {
    return undefined;
  }
  
  return relative;
}

/**
 * Slugify a name for use as a filename.
 * Converts to lowercase, replaces spaces and special chars with hyphens.
 * 
 * @param name - Name to slugify
 * @returns Slugified name safe for filesystem
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Trim leading/trailing hyphens
    || 'unnamed';  // Fallback if empty
}

/**
 * Get filename without extension.
 * 
 * @param filename - Filename with extension
 * @returns Filename without extension
 */
export function getNameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}
