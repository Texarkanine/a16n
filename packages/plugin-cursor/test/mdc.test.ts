import { describe, it, expect } from 'vitest';
import { parseMdc, hasFrontmatterBlock } from '../src/mdc.js';

describe('parseMdc', () => {
  it('should parse frontmatter with alwaysApply: true', () => {
    const content = `---
alwaysApply: true
---

Body content here.`;

    const result = parseMdc(content);

    expect(result.frontmatter.alwaysApply).toBe(true);
    expect(result.body).toBe('Body content here.');
  });

  it('should parse frontmatter with alwaysApply: false', () => {
    const content = `---
alwaysApply: false
---

Body content.`;

    const result = parseMdc(content);

    expect(result.frontmatter.alwaysApply).toBe(false);
  });

  it('should parse description field', () => {
    const content = `---
description: "React component generator"
---

Generate React components.`;

    const result = parseMdc(content);

    expect(result.frontmatter.description).toBe('React component generator');
  });

  it('should parse description field without quotes', () => {
    const content = `---
description: React helper
---

Content.`;

    const result = parseMdc(content);

    expect(result.frontmatter.description).toBe('React helper');
  });

  it('should parse globs field as string', () => {
    const content = `---
globs: **/*.tsx,**/*.jsx
---

Rules for React files.`;

    const result = parseMdc(content);

    expect(result.frontmatter.globs).toBe('**/*.tsx,**/*.jsx');
  });

  it('should handle content with no frontmatter', () => {
    const content = `Just plain content without frontmatter.`;

    const result = parseMdc(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe('Just plain content without frontmatter.');
  });

  it('should handle multiple frontmatter fields', () => {
    const content = `---
alwaysApply: true
description: Full config
globs: **/*.ts
---

Multi-field rule.`;

    const result = parseMdc(content);

    expect(result.frontmatter.alwaysApply).toBe(true);
    expect(result.frontmatter.description).toBe('Full config');
    expect(result.frontmatter.globs).toBe('**/*.ts');
    expect(result.body).toBe('Multi-field rule.');
  });

  it('should handle multi-line body content', () => {
    const content = `---
alwaysApply: true
---

Line 1
Line 2
Line 3`;

    const result = parseMdc(content);

    expect(result.body).toBe('Line 1\nLine 2\nLine 3');
  });

  it('should handle empty body', () => {
    const content = `---
alwaysApply: true
---
`;

    const result = parseMdc(content);

    expect(result.frontmatter.alwaysApply).toBe(true);
    expect(result.body).toBe('');
  });
});

describe('hasFrontmatterBlock', () => {
  it('should detect a leading frontmatter block', () => {
    expect(hasFrontmatterBlock('---\ndescription: v\n---\nbody')).toBe(true);
  });

  it('should ignore a thematic break with no closing delimiter', () => {
    expect(hasFrontmatterBlock('---\n\n# Title\n\nbody')).toBe(false);
  });

  it('should ignore paired thematic breaks with no key line between', () => {
    expect(hasFrontmatterBlock('---\n\n# Title\n\n---\n\nmore')).toBe(false);
  });

  // Deliberate over-report, pinned so it stays a known behavior. `Note: see docs.`
  // between two breaks is a valid single-key YAML document, so nothing lexical
  // separates it from real frontmatter. Over-reporting costs one advisory line and
  // never touches content; under-reporting restores the silent passthrough this
  // advisory exists to break.
  it('should report a paired-break block whose prose line parses as a YAML key', () => {
    expect(hasFrontmatterBlock('---\n\nNote: see docs.\n\n---\n\nmore')).toBe(true);
  });

  it('should detect frontmatter whose value spans multiple lines', () => {
    expect(hasFrontmatterBlock('---\nallowed-tools:\n  - Bash(git:*)\n  - Read\n---\nbody')).toBe(
      true,
    );
  });

  it('should return false for a body with no delimiters at all', () => {
    expect(hasFrontmatterBlock('Just a prompt.\n')).toBe(false);
  });

  it('should return false when the first --- appears after prose', () => {
    expect(hasFrontmatterBlock('Intro prose.\n\n---\nkey: v\n---\n')).toBe(false);
  });
});
