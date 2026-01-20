import { describe, it, expect } from 'vitest';
import { WarningCode, type Warning } from '../src/index.js';

describe('WarningCode', () => {
  it('should have Merged code', () => {
    expect(WarningCode.Merged).toBe('merged');
  });

  it('should have Approximated code', () => {
    expect(WarningCode.Approximated).toBe('approximated');
  });

  it('should have Skipped code', () => {
    expect(WarningCode.Skipped).toBe('skipped');
  });

  it('should have Overwritten code', () => {
    expect(WarningCode.Overwritten).toBe('overwritten');
  });
});

describe('Warning', () => {
  it('should create a warning with code and message', () => {
    const warning: Warning = {
      code: WarningCode.Merged,
      message: 'Merged 3 files into CLAUDE.md',
    };

    expect(warning.code).toBe(WarningCode.Merged);
    expect(warning.message).toBe('Merged 3 files into CLAUDE.md');
  });

  it('should support optional sources array', () => {
    const warning: Warning = {
      code: WarningCode.Merged,
      message: 'Merged files',
      sources: ['file1.mdc', 'file2.mdc', 'file3.mdc'],
    };

    expect(warning.sources).toHaveLength(3);
    expect(warning.sources).toContain('file1.mdc');
  });

  it('should support optional details object', () => {
    const warning: Warning = {
      code: WarningCode.Approximated,
      message: 'Globs approximated',
      details: { originalGlobs: ['**/*.ts'], approximation: 'TypeScript files' },
    };

    expect(warning.details).toBeDefined();
    expect(warning.details?.originalGlobs).toEqual(['**/*.ts']);
  });
});
