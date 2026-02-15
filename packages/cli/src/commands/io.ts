/**
 * Abstraction over CLI I/O operations.
 *
 * Enables command handlers to be tested without relying on console/process
 * globals. In production, maps to console.log/error and process.exitCode.
 * In tests, can be replaced with spies.
 */
export interface CommandIO {
  /** Write to stdout (like console.log) */
  log(message: string): void;
  /** Write to stderr (like console.error) */
  error(message: string): void;
  /** Set the process exit code */
  setExitCode(code: number): void;
}

/**
 * Create the default CommandIO that maps to console and process globals.
 */
export function createDefaultIO(): CommandIO {
  return {
    log: (msg: string) => console.log(msg),
    error: (msg: string) => console.error(msg),
    setExitCode: (code: number) => { process.exitCode = code; },
  };
}
