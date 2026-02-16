/**
 * I/O abstraction for CLI command handlers.
 * Enables testability by decoupling commands from direct console usage.
 */
export interface CommandIO {
  /** Write an informational message to stdout. */
  log(message: string): void;

  /** Write an error message to stderr. */
  error(message: string): void;

  /** Set the process exit code. */
  setExitCode(code: number): void;
}
