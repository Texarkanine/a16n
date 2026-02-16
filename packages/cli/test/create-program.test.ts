/**
 * Tests for createProgram factory export.
 *
 * Verifies that createProgram() returns a properly structured Commander
 * program with all expected subcommands and options, enabling the doc
 * generator to dynamically import the real CLI definition instead of
 * maintaining a hardcoded duplicate.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { createProgram } from '../src/index.js';
import type { CommandIO } from '../src/commands/io.js';

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

  it('reports the version from package.json', () => {
    const program = createProgram(null);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../package.json') as { version: string };
    expect(program.version()).toBe(pkg.version);
  });

  it('does not throw when engine is null (structure-only usage)', () => {
    expect(() => createProgram(null)).not.toThrow();
  });

  describe('action handlers error when engine is null', () => {
    let mockIO: CommandIO;
    let exitSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockIO = {
        log: vi.fn(),
        error: vi.fn(),
        setExitCode: vi.fn(),
      };
      exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    });

    afterEach(() => {
      exitSpy.mockRestore();
    });

    it('convert action emits error and exits non-zero when engine is null', async () => {
      const program = createProgram(null, mockIO);
      program.exitOverride();
      try {
        await program.parseAsync(['convert', '-f', 'cursor', '-t', 'claude'], { from: 'user' });
      } catch { /* commander exitOverride throws */ }
      expect(mockIO.error).toHaveBeenCalledWith(expect.stringContaining('engine not initialized'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('discover action emits error and exits non-zero when engine is null', async () => {
      const program = createProgram(null, mockIO);
      program.exitOverride();
      try {
        await program.parseAsync(['discover', '-f', 'cursor'], { from: 'user' });
      } catch { /* commander exitOverride throws */ }
      expect(mockIO.error).toHaveBeenCalledWith(expect.stringContaining('engine not initialized'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });

    it('plugins action emits error and exits non-zero when engine is null', async () => {
      const program = createProgram(null, mockIO);
      program.exitOverride();
      try {
        await program.parseAsync(['plugins'], { from: 'user' });
      } catch { /* commander exitOverride throws */ }
      expect(mockIO.error).toHaveBeenCalledWith(expect.stringContaining('engine not initialized'));
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
