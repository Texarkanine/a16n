/**
 * Warning codes indicating the type of issue encountered.
 */
export enum WarningCode {
  /** Multiple items were collapsed into one file */
  Merged = 'merged',
  /** Feature was translated imperfectly */
  Approximated = 'approximated',
  /** Feature was not supported and omitted */
  Skipped = 'skipped',
  /** Existing file was replaced */
  Overwritten = 'overwritten',
  /** File was renamed to avoid collision */
  FileRenamed = 'file-renamed',
  /** Git-ignored source with tracked output (or vice versa) */
  BoundaryCrossing = 'boundary-crossing',
  /** Sources have conflicting git status (some ignored, some tracked) */
  GitStatusConflict = 'git-status-conflict',
  /** IR file version is incompatible with current reader version */
  VersionMismatch = 'version-mismatch',
}

/**
 * A warning about something that happened during conversion.
 * Warnings don't stop the conversion but should be surfaced to users.
 */
export interface Warning {
  /** The type of warning */
  code: WarningCode;
  /** Human-readable description of the issue */
  message: string;
  /** Source files that were affected (optional) */
  sources?: string[];
  /** Additional details about the warning (optional) */
  details?: Record<string, unknown>;
}
