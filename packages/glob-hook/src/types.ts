/**
 * Input received from Claude Code hook system via stdin.
 *
 * @see https://docs.anthropic.com/en/docs/claude-code/hooks
 */
export interface HookInput {
  hook_event_name?: 'PreToolUse' | 'PostToolUse';
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    command?: string;
  };
  tool_response?: {
    content?: string;
  };
}

/**
 * Output to Claude Code hook system via stdout.
 *
 * @see https://docs.anthropic.com/en/docs/claude-code/hooks
 */
export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    additionalContext?: string;
  };
}

/**
 * Parsed CLI options.
 */
export interface CliOptions {
  /** Comma-separated glob patterns to match against file paths */
  globs: string;
  /** Path to file containing context to inject when matched */
  contextFile: string;
}
