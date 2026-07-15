/**
 * Contract tests for Texarkanine paper/ember docs theme tokens and colorMode.
 *
 * Guards Infima CSS variables in custom.css and system-preference color mode
 * in docusaurus.config.js against regressions / Material selector copy-paste.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const customCss = readFileSync(join(packageRoot, 'src/css/custom.css'), 'utf8');
const docusaurusConfig = readFileSync(
  join(packageRoot, 'docusaurus.config.js'),
  'utf8',
);

function blockAfter(source: string, marker: string): string {
  const start = source.indexOf(marker);
  expect(start, `missing block marker: ${marker}`).toBeGreaterThanOrEqual(0);
  const openBrace = source.indexOf('{', start);
  expect(openBrace).toBeGreaterThan(start);
  let depth = 0;
  for (let i = openBrace; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(openBrace, i + 1);
    }
  }
  throw new Error(`unclosed block starting at ${marker}`);
}

describe('docs theme tokens', () => {
  it('does not use Material color-scheme selectors', () => {
    expect(customCss).not.toMatch(/data-md-color-scheme/);
  });

  it('defines Texarkanine light paper/ember tokens in :root', () => {
    const root = blockAfter(customCss, ':root');
    expect(root).toMatch(/--ifm-color-primary:\s*#b45309\b/i);
    expect(root).toMatch(/--ifm-background-color:\s*#f6f0e4\b/i);
    expect(root).toMatch(/--ifm-code-background:\s*#ebe4d4\b/i);
  });

  it('defines Texarkanine dark warm-charcoal tokens under [data-theme=\'dark\']', () => {
    const dark = blockAfter(customCss, "[data-theme='dark']");
    expect(dark).toMatch(/--ifm-color-primary:\s*#de8131\b/i);
    expect(dark).toMatch(/--ifm-background-color:\s*#1c1914\b/i);
    expect(dark).toMatch(/--ifm-link-color:\s*#fb923c\b/i);
    expect(dark).toMatch(/--ifm-code-background:\s*#2a251c\b/i);
  });
});

describe('docs colorMode', () => {
  it('respects prefers-color-scheme', () => {
    expect(docusaurusConfig).toMatch(
      /respectPrefersColorScheme:\s*true\b/,
    );
  });

  it('keeps the color mode switch enabled', () => {
    expect(docusaurusConfig).not.toMatch(/disableSwitch:\s*true\b/);
  });
});
