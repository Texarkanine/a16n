import chalk from 'chalk';
import type { Warning, WarningCode } from '@a16n/models';

const ICONS: Record<WarningCode, string> = {
  merged: '⚠',
  approximated: '≈',
  skipped: '⊘',
  overwritten: '↺',
  'file-renamed': '→',
};

const HINTS: Partial<Record<WarningCode, string>> = {
  merged: 'Converting back will produce 1 file, not the original count',
  approximated: 'Behavior may differ slightly between tools',
};

/**
 * Format a warning for CLI output with colors, icons, and hints.
 */
export function formatWarning(warning: Warning): string {
  const icon = ICONS[warning.code] || '!';
  const header = chalk.yellow(`${icon} ${warning.message}`);

  let output = header;

  if (warning.sources && warning.sources.length > 0) {
    output += '\n' + chalk.gray('  Sources:');
    for (const source of warning.sources.slice(0, 5)) {
      output += '\n' + chalk.gray(`    - ${source}`);
    }
    if (warning.sources.length > 5) {
      output += '\n' + chalk.gray(`    ... and ${warning.sources.length - 5} more`);
    }
  }

  const hint = HINTS[warning.code];
  if (hint) {
    output += '\n' + chalk.gray(`  Hint: ${hint}`);
  }

  return output;
}

/**
 * Format a summary line with counts.
 */
export function formatSummary(discovered: number, written: number, warnings: number): string {
  return chalk.bold(`Summary: ${discovered} discovered, ${written} written, ${warnings} warnings`);
}

/**
 * Format an error message with suggestions.
 */
export function formatError(message: string, suggestion?: string): string {
  let output = chalk.red(`Error: ${message}`);
  if (suggestion) {
    output += '\n' + chalk.gray(`  ${suggestion}`);
  }
  return output;
}
