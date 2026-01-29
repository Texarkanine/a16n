import type { HookInput, HookOutput } from './types.js';

/**
 * Parse JSON input from a string.
 * Returns null if parsing fails or input is empty.
 *
 * @param input - Raw string input (typically from stdin)
 * @returns Parsed HookInput or null if invalid
 */
export function parseStdin(input: string): HookInput | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as HookInput;
  } catch {
    return null;
  }
}

/**
 * Write JSON output to stdout.
 *
 * @param output - HookOutput to serialize and write
 */
export function writeOutput(output: HookOutput): void {
  console.log(JSON.stringify(output));
}

/**
 * Create an empty output (for no-match or error cases).
 * Claude hooks interpret {} as "no special output".
 */
export function createEmptyOutput(): HookOutput {
  return {};
}

/**
 * Create a match output with additionalContext.
 *
 * @param context - The context content to inject
 * @returns HookOutput with additionalContext set
 */
export function createMatchOutput(context: string): HookOutput {
  return {
    hookSpecificOutput: {
      additionalContext: context,
    },
  };
}
