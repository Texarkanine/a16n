import { describe, it, expect } from 'vitest';
import { detectNonSpecFeatures, NON_SPEC_FEATURES } from '../src/spec-compliance.js';

/** Look up the advisory label for a feature id. */
function labelFor(id: string): string {
  const feature = NON_SPEC_FEATURES.find(f => f.id === id);
  expect(feature, `no exported feature with id '${id}'`).toBeDefined();
  return feature!.label;
}

/**
 * One positive case per exported feature.
 *
 * Keyed by feature id so a coverage test can assert this table and
 * NON_SPEC_FEATURES never drift apart.
 */
const POSITIVE_CASES: Record<string, { frontmatter?: Record<string, unknown>; body?: string }> = {
  'argument-hint': { frontmatter: { 'argument-hint': '<pr-number>' } },
  arguments: { frontmatter: { arguments: [{ name: 'pr' }] } },
  model: { frontmatter: { model: 'claude-sonnet-4' } },
  effort: { frontmatter: { effort: 'high' } },
  context: { frontmatter: { context: 'fork' } },
  agent: { frontmatter: { agent: 'reviewer' } },
  shell: { frontmatter: { shell: 'bash' } },
  'disallowed-tools': { frontmatter: { 'disallowed-tools': 'Bash' } },
  'user-invocable': { frontmatter: { 'user-invocable': true } },
  'arguments-substitution': { body: 'Fix issue $ARGUMENTS then report back.' },
  'positional-arguments': {
    frontmatter: { 'argument-hint': '<pr>' },
    body: 'Review PR $1 for correctness.',
  },
  'named-arguments': {
    frontmatter: { arguments: [{ name: 'pr' }] },
    body: 'Review PR $pr for correctness.',
  },
  'bash-injection': { body: '- Current diff: !`gh pr diff`' },
  'claude-variables': { body: 'See ${CLAUDE_SKILL_DIR}/references/guide.md' },
  'path-includes': { body: 'Read @src/utils.js before editing.' },
};

const SPEC_ONLY_FRONTMATTER = {
  name: 'deploy',
  description: 'Deploy the app',
  license: 'MIT',
  compatibility: { claude: '>=1.0' },
  metadata: { author: 'someone' },
  'allowed-tools': 'Bash(git:*)',
};

describe('detectNonSpecFeatures', () => {
  describe('spec-compliant input', () => {
    it('should return nothing for spec-only frontmatter and a plain body', () => {
      expect(detectNonSpecFeatures(SPEC_ONLY_FRONTMATTER, 'Deploy the app carefully.')).toEqual([]);
    });

    it('should not report Category-C keys that a16n models natively', () => {
      const frontmatter = { paths: ['src/**'], 'disable-model-invocation': true };
      expect(detectNonSpecFeatures(frontmatter, 'Body.')).toEqual([]);
    });

    it('should not report hooks, which are skipped before detection runs', () => {
      const frontmatter = { hooks: { PreToolUse: [] } };
      expect(detectNonSpecFeatures(frontmatter, 'Body.')).toEqual([]);
    });
  });

  describe('positive detection', () => {
    it.each(Object.keys(POSITIVE_CASES))('should detect %s', id => {
      const { frontmatter = {}, body = '' } = POSITIVE_CASES[id]!;
      expect(detectNonSpecFeatures(frontmatter, body)).toContain(labelFor(id));
    });

    it('should have a positive case for every exported feature', () => {
      expect(NON_SPEC_FEATURES.map(f => f.id).sort()).toEqual(Object.keys(POSITIVE_CASES).sort());
    });

    it('should detect indexed $ARGUMENTS[0]', () => {
      expect(detectNonSpecFeatures({}, 'Use $ARGUMENTS[0] as the target.')).toContain(
        labelFor('arguments-substitution'),
      );
    });

    it('should detect bash injection after leading whitespace', () => {
      expect(detectNonSpecFeatures({}, '  !`git status`')).toContain(labelFor('bash-injection'));
    });

    it('should detect ${CLAUDE_PROJECT_DIR}', () => {
      expect(detectNonSpecFeatures({}, 'Run ${CLAUDE_PROJECT_DIR}/bin/check')).toContain(
        labelFor('claude-variables'),
      );
    });

    it.each(['@./docs/foo.md', '@../x/y.ts', '@/abs/path/file.md'])(
      'should detect the path include %s',
      ref => {
        expect(detectNonSpecFeatures({}, `Read ${ref} first.`)).toContain(labelFor('path-includes'));
      },
    );
  });

  describe('false positives the detector must not recreate (#142)', () => {
    it.each(['@reviewer', '@author', '@coderabbitai'])(
      'should not treat the prose mention %s as a path include',
      mention => {
        expect(detectNonSpecFeatures({}, `Reviewed by ${mention} yesterday.`)).toEqual([]);
      },
    );

    it('should not treat an email address as a path include', () => {
      expect(detectNonSpecFeatures({}, 'Contact foo@bar.com for access.')).toEqual([]);
    });

    it('should not treat a scoped npm package as a path include', () => {
      expect(detectNonSpecFeatures({}, 'Install @modelcontextprotocol/sdk first.')).toEqual([]);
    });

    it('should not report $1 when the skill declares no arguments', () => {
      expect(detectNonSpecFeatures({}, "Run awk '{print $1}' on the output.")).toEqual([]);
    });

    it('should not report literal-preserved KEY=!`cmd` assignments', () => {
      expect(detectNonSpecFeatures({}, 'BRANCH=!`git branch --show-current`')).toEqual([]);
    });
  });

  describe('$N gating', () => {
    it('should report $1 when frontmatter declares argument-hint', () => {
      const result = detectNonSpecFeatures({ 'argument-hint': '<n>' }, "awk '{print $1}'");
      expect(result).toContain(labelFor('positional-arguments'));
    });

    it('should report $1 when the body also uses $ARGUMENTS', () => {
      const result = detectNonSpecFeatures({}, 'Target $ARGUMENTS, starting with $1.');
      expect(result).toContain(labelFor('positional-arguments'));
    });
  });

  describe('multiple features', () => {
    it('should return every detected feature once, in NON_SPEC_FEATURES order', () => {
      const frontmatter = { 'argument-hint': '<pr>', model: 'claude-sonnet-4' };
      const body = 'Diff: !`gh pr diff`\nTarget $ARGUMENTS and $1.\nAlso !`git log`.';

      const result = detectNonSpecFeatures(frontmatter, body);

      expect(result).toEqual([
        labelFor('argument-hint'),
        labelFor('model'),
        labelFor('arguments-substitution'),
        labelFor('positional-arguments'),
        labelFor('bash-injection'),
      ]);
    });
  });
});
