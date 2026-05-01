import { describe, it, expect, vi } from 'vitest';
import { CustomizationType } from '@a16njs/models';
import type { A16nEngine } from '@a16njs/engine';
import { handlePlugins } from '../../src/commands/plugins.js';
import type { CommandIO } from '../../src/commands/io.js';

/**
 * Unit tests for the plugins command handler.
 */

function createMockIO(): CommandIO & { logs: string[]; errors: string[] } {
  const state = { logs: [] as string[], errors: [] as string[] };
  return {
    ...state,
    log: (msg: string) => { state.logs.push(msg); },
    error: (msg: string) => { state.errors.push(msg); },
    setExitCode: vi.fn(),
  };
}

describe('handlePlugins', () => {
  it('should list all registered plugins', () => {
    const io = createMockIO();
    const engine = {
      listPlugins: vi.fn().mockReturnValue([
        { id: 'cursor', name: 'Cursor IDE', supports: [CustomizationType.GlobalPrompt], source: 'bundled' },
        { id: 'claude', name: 'Claude Code', supports: [CustomizationType.GlobalPrompt, CustomizationType.FileRule], source: 'bundled' },
      ]),
    } as unknown as A16nEngine;

    handlePlugins(engine, io);

    expect(engine.listPlugins).toHaveBeenCalled();
    const output = io.logs.join('\n');
    expect(output).toContain('cursor');
    expect(output).toContain('Cursor IDE');
    expect(output).toContain('claude');
    expect(output).toContain('Claude Code');
  });

  it('should show supported types for each plugin', () => {
    const io = createMockIO();
    const engine = {
      listPlugins: vi.fn().mockReturnValue([
        { id: 'cursor', name: 'Cursor IDE', supports: [CustomizationType.GlobalPrompt], source: 'bundled' },
      ]),
    } as unknown as A16nEngine;

    handlePlugins(engine, io);

    const output = io.logs.join('\n');
    expect(output).toContain('Supports:');
    expect(output).toContain(CustomizationType.GlobalPrompt);
  });

  it('should handle empty plugin list', () => {
    const io = createMockIO();
    const engine = {
      listPlugins: vi.fn().mockReturnValue([]),
    } as unknown as A16nEngine;

    handlePlugins(engine, io);

    expect(engine.listPlugins).toHaveBeenCalled();
    expect(io.logs.some(l => l.includes('Available plugins'))).toBe(true);
  });
});
