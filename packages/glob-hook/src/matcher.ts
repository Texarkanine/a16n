import micromatch from 'micromatch';

/**
 * Check if a file path matches any of the provided glob patterns.
 *
 * @param filePath - The file path to test
 * @param patterns - Array of glob patterns to match against
 * @returns true if the file path matches any pattern, false otherwise
 */
export function matchesAny(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }

  return micromatch.isMatch(filePath, patterns, {
    dot: true, // Match dotfiles like .eslintrc.js
  });
}
