/**
 * Tests for createProgram factory export.
 *
 * Verifies that createProgram() returns a properly structured Commander
 * program with all expected subcommands and options, enabling the doc
 * generator to dynamically import the real CLI definition instead of
 * maintaining a hardcoded duplicate.
 */

import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { createProgram } from '../src/index.js';

/** Helper to get option flags from a Commander command */
function getOptionFlags(cmd: Command): string[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((cmd as any).options as { flags: string }[]).map((o) => o.flags);
}

describe('createProgram', () => {
  it('returns a Command instance', () => {
    const program = createProgram(null);
    expect(program).toBeInstanceOf(Command);
  });

  it('has convert, discover, and plugins subcommands', () => {
    const program = createProgram(null);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('convert');
    expect(names).toContain('discover');
    expect(names).toContain('plugins');
  });

  it('convert has --from-dir, --to-dir, and --rewrite-path-refs options', () => {
    const program = createProgram(null);
    const convert = program.commands.find((c) => c.name() === 'convert')!;
    expect(convert).toBeDefined();

    const flags = getOptionFlags(convert);
    expect(flags).toContainEqual(expect.stringContaining('--from-dir'));
    expect(flags).toContainEqual(expect.stringContaining('--to-dir'));
    expect(flags).toContainEqual(expect.stringContaining('--rewrite-path-refs'));
  });

  it('discover has --from-dir option', () => {
    const program = createProgram(null);
    const discover = program.commands.find((c) => c.name() === 'discover')!;
    expect(discover).toBeDefined();

    const flags = getOptionFlags(discover);
    expect(flags).toContainEqual(expect.stringContaining('--from-dir'));
  });

  it('does not throw when engine is null (structure-only usage)', () => {
    expect(() => createProgram(null)).not.toThrow();
  });
});
