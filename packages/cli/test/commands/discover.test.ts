import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import type { A16nEngine } from '@a16njs/engine';
import { CustomizationType } from '@a16njs/models';
import { handleDiscover, type DiscoverCommandOptions } from '../../src/commands/discover.js';
import type { CommandIO } from '../../src/commands/io.js';

/**
 * Unit tests for the discover command handler.
 * Tests the command logic in isolation using mock engine and IO.
 */

function createMockIO() {
  const logs: string[] = [];
  const errors: string[] = [];
  let exitCode: number | undefined;
  return {
    get logs() { return logs; },
    get errors() { return errors; },
    get exitCode() { return exitCode; },
    log: (msg: string) => { logs.push(msg); },
    error: (msg: string) => { errors.push(msg); },
    setExitCode: (code: number) => { exitCode = code; },
  };
}

function createMockEngine(overrides: Partial<A16nEngine> = {}): A16nEngine {
  return {
    convert: vi.fn(),
    discover: vi.fn().mockResolvedValue({ items: [], warnings: [] }),
    listPlugins: vi.fn(),
    getPlugin: vi.fn(),
    registerPlugin: vi.fn(),
    discoverAndRegisterPlugins: vi.fn(),
    ...overrides,
  } as unknown as A16nEngine;
}

describe('handleDiscover', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'a16n-discover-test-'));
  });

  describe('directory validation', () => {
    it('should error when directory does not exist', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: DiscoverCommandOptions = {
        from: 'cursor',
        fromDir: '/nonexistent/path',
      };

      await handleDiscover(engine, '.', options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('not a valid directory'))).toBe(true);
    });

    it('should reject --to-dir flag', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: DiscoverCommandOptions = {
        from: 'cursor',
        toDir: tmpDir,
      };

      await handleDiscover(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('--to-dir is not applicable'))).toBe(true);
    });
  });

  describe('engine interaction', () => {
    it('should call engine.discover with correct plugin and path', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: DiscoverCommandOptions = { from: 'cursor' };

      await handleDiscover(engine, tmpDir, options, io);

      expect(engine.discover).toHaveBeenCalledWith('cursor', path.resolve(tmpDir));
    });

    it('should use --from-dir when specified', async () => {
      const io = createMockIO();
      const engine = createMockEngine();
      const options: DiscoverCommandOptions = {
        from: 'cursor',
        fromDir: tmpDir,
      };

      await handleDiscover(engine, '.', options, io);

      expect(engine.discover).toHaveBeenCalledWith('cursor', path.resolve(tmpDir));
    });
  });

  describe('output formatting', () => {
    it('should output JSON when --json is specified', async () => {
      const io = createMockIO();
      const items = [
        { type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' },
      ];
      const engine = createMockEngine({
        discover: vi.fn().mockResolvedValue({ items, warnings: [] }),
      });
      const options: DiscoverCommandOptions = { from: 'cursor', json: true };

      await handleDiscover(engine, tmpDir, options, io);

      expect(io.logs).toHaveLength(1);
      const parsed = JSON.parse(io.logs[0]!);
      expect(parsed.items).toHaveLength(1);
    });

    it('should show item count in human-readable mode', async () => {
      const io = createMockIO();
      const items = [
        { type: CustomizationType.GlobalPrompt, content: 'test', sourcePath: '.cursor/rules/test.mdc' },
      ];
      const engine = createMockEngine({
        discover: vi.fn().mockResolvedValue({ items, warnings: [] }),
      });
      const options: DiscoverCommandOptions = { from: 'cursor' };

      await handleDiscover(engine, tmpDir, options, io);

      expect(io.logs.some(l => l.includes('1 items'))).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle engine errors gracefully', async () => {
      const io = createMockIO();
      const engine = createMockEngine({
        discover: vi.fn().mockRejectedValue(new Error('Unknown plugin: badplugin')),
      });
      const options: DiscoverCommandOptions = { from: 'badplugin' };

      await handleDiscover(engine, tmpDir, options, io);

      expect(io.exitCode).toBe(1);
      expect(io.errors.some(e => e.includes('Unknown plugin: badplugin'))).toBe(true);
    });
  });
});
