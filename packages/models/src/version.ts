/**
 * Kubernetes-style IR version format.
 * Format: v{major}{stability}{revision}
 * Examples: v1beta1, v2alpha3, v1stable1, v11 (stable)
 *
 * Requirements:
 * - Must start with 'v'
 * - Must have a major version number
 * - May have stability identifier (alpha, beta, stable, or empty for stable)
 * - Must end with a revision number (trailing number required)
 *
 * Valid: v1beta1, v2alpha3, v10stable5, v11
 * Invalid: v1, v2beta, vbeta1, 1beta1
 */
export type IRVersion = string & { readonly __brand: 'IRVersion' };

/**
 * Parsed components of an IR version.
 */
export interface ParsedIRVersion {
  /** Major version number (e.g., 1, 2, 10) */
  major: number;
  /** Stability identifier (alpha, beta, stable, or empty string for stable) */
  stability: string;
  /** Revision number (e.g., 1, 2, 3) */
  revision: number;
}

/**
 * The current IR version used by this version of a16n.
 */
export const CURRENT_IR_VERSION: IRVersion = 'v1beta1' as IRVersion;

/**
 * Parse an IR version string into its components.
 *
 * @param version - The version string to parse (e.g., 'v1beta1')
 * @returns Parsed version components or null if invalid
 *
 * @example
 * parseIRVersion('v1beta1') // { major: 1, stability: 'beta', revision: 1 }
 * parseIRVersion('v2alpha3') // { major: 2, stability: 'alpha', revision: 3 }
 * parseIRVersion('v11') // { major: 1, stability: '', revision: 1 }
 * parseIRVersion('v1') // null (missing trailing revision number)
 */
export function parseIRVersion(version: string): ParsedIRVersion | null {
  const regex = /^v(\d+)([a-z]*)(\d+)$/;
  const match = regex.exec(version);

  if (!match) {
    return null;
  }

  return {
    major: parseInt(match[1]!, 10),
    stability: match[2] || '',
    revision: parseInt(match[3]!, 10),
  };
}

/**
 * Check if two IR versions are compatible.
 *
 * Compatibility rules (forward compatibility guarantee):
 * 1. Major versions must match
 * 2. Stability must match (alpha != beta != stable)
 * 3. Reader revision >= file revision (newer reader can read older files)
 *
 * @param readerVersion - The version of the reader (current a16n version)
 * @param fileVersion - The version found in the IR file
 * @returns true if compatible, false otherwise
 *
 * @example
 * areVersionsCompatible('v1beta2', 'v1beta1') // true (reader newer)
 * areVersionsCompatible('v1beta1', 'v1beta2') // false (file too new)
 * areVersionsCompatible('v2beta1', 'v1beta1') // false (major mismatch)
 * areVersionsCompatible('v1stable1', 'v1beta1') // false (stability mismatch)
 */
export function areVersionsCompatible(
  readerVersion: string,
  fileVersion: string
): boolean {
  const reader = parseIRVersion(readerVersion);
  const file = parseIRVersion(fileVersion);

  // Invalid versions are incompatible
  if (!reader || !file) {
    return false;
  }

  // Normalize empty stability to 'stable'
  const readerStability = reader.stability === '' ? 'stable' : reader.stability;
  const fileStability = file.stability === '' ? 'stable' : file.stability;

  // Major versions must match
  if (reader.major !== file.major) {
    return false;
  }

  // Stability must match
  if (readerStability !== fileStability) {
    return false;
  }

  // Reader revision must be >= file revision (forward compatibility)
  return reader.revision >= file.revision;
}

/**
 * Get the current IR version.
 *
 * @returns The current IR version constant
 */
export function getCurrentVersion(): IRVersion {
  return CURRENT_IR_VERSION;
}
