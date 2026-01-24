import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseStdin, writeOutput, createEmptyOutput, createMatchOutput } from '../src/io';
import type { HookInput, HookOutput } from '../src/types';

describe('parseStdin', () => {
  it('parses valid JSON input', () => {
    const input = '{"tool_name":"Write","tool_input":{"file_path":"src/test.ts"}}';
    const result = parseStdin(input);

    expect(result).toEqual({
      tool_name: 'Write',
      tool_input: { file_path: 'src/test.ts' },
    });
  });

  it('parses JSON with extra fields', () => {
    const input = '{"tool_name":"Read","tool_input":{"file_path":"test.ts","content":"data"},"extra":"field"}';
    const result = parseStdin(input);

    expect(result?.tool_name).toBe('Read');
    expect(result?.tool_input?.file_path).toBe('test.ts');
  });

  it('returns null for invalid JSON', () => {
    const result = parseStdin('not valid json');
    expect(result).toBeNull();
  });

  it('returns null for empty input', () => {
    const result = parseStdin('');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    const result = parseStdin('   \n  ');
    expect(result).toBeNull();
  });
});

describe('writeOutput', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('writes JSON output to stdout', () => {
    const output: HookOutput = {
      hookSpecificOutput: {
        additionalContext: 'test context',
      },
    };

    writeOutput(output);

    expect(consoleSpy).toHaveBeenCalledWith(
      '{"hookSpecificOutput":{"additionalContext":"test context"}}'
    );
  });

  it('writes empty object for empty output', () => {
    writeOutput({});
    expect(consoleSpy).toHaveBeenCalledWith('{}');
  });
});

describe('createEmptyOutput', () => {
  it('returns empty object', () => {
    expect(createEmptyOutput()).toEqual({});
  });
});

describe('createMatchOutput', () => {
  it('creates output with additionalContext', () => {
    const result = createMatchOutput('My context rules');

    expect(result).toEqual({
      hookSpecificOutput: {
        additionalContext: 'My context rules',
      },
    });
  });

  it('preserves multiline content', () => {
    const multiline = 'Line 1\nLine 2\nLine 3';
    const result = createMatchOutput(multiline);

    expect(result.hookSpecificOutput?.additionalContext).toBe(multiline);
  });

  it('handles special characters', () => {
    const special = 'Quote: "test" and tab:\there';
    const result = createMatchOutput(special);

    expect(result.hookSpecificOutput?.additionalContext).toBe(special);
  });
});
