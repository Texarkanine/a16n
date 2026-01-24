import { describe, it, expect } from 'vitest';
import { matchesAny } from '../src/matcher';

describe('matchesAny', () => {
  it('matches simple extension pattern', () => {
    expect(matchesAny('src/Button.tsx', ['**/*.tsx'])).toBe(true);
  });

  it('does not match when extension differs', () => {
    expect(matchesAny('src/Button.ts', ['**/*.tsx'])).toBe(false);
  });

  it('matches with multiple patterns (first matches)', () => {
    expect(matchesAny('src/index.ts', ['**/*.ts', '**/*.tsx'])).toBe(true);
  });

  it('matches with multiple patterns (second matches)', () => {
    expect(matchesAny('src/Button.tsx', ['**/*.ts', '**/*.tsx'])).toBe(true);
  });

  it('matches deeply nested paths', () => {
    expect(matchesAny('src/deep/nested/file.ts', ['**/*.ts'])).toBe(true);
  });

  it('matches dotfiles', () => {
    expect(matchesAny('.eslintrc.js', ['**/*.js'])).toBe(true);
  });

  it('matches directory patterns', () => {
    expect(matchesAny('src/components/Button.tsx', ['src/components/**'])).toBe(true);
  });

  it('does not match directory pattern when path is outside', () => {
    expect(matchesAny('src/utils/helpers.ts', ['src/components/**'])).toBe(false);
  });

  it('matches basename pattern', () => {
    expect(matchesAny('Button.tsx', ['*.tsx'])).toBe(true);
  });

  it('handles empty patterns array', () => {
    expect(matchesAny('src/file.ts', [])).toBe(false);
  });

  it('handles paths with special characters', () => {
    expect(matchesAny('src/[id]/page.tsx', ['**/*.tsx'])).toBe(true);
  });

  it('matches exact filename patterns', () => {
    expect(matchesAny('package.json', ['package.json'])).toBe(true);
  });

  it('handles multiple extensions pattern', () => {
    expect(matchesAny('src/file.test.ts', ['**/*.test.ts'])).toBe(true);
  });

  it('does not match partial extension', () => {
    expect(matchesAny('src/file.tsx', ['**/*.ts'])).toBe(false);
  });
});
