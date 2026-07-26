/**
 * AgentSkills.io spec-compliance detection for Claude skills.
 *
 * Claude is a large superset of the AgentSkills.io spec. a16n's IR is
 * spec-shaped, so any Claude-only feature is a portability hazard at ingest —
 * regardless of the destination harness. This module observes (never mutates)
 * a parsed SKILL.md and reports the non-spec features it uses.
 *
 * Scope is deliberately narrow: only features that are BOTH outside the spec
 * AND unmodelled by a16n's IR, so their runtime behavior is lost on ingest.
 * `paths` and `disable-model-invocation` are non-spec but modelled, so they are
 * not reported. `hooks` is excluded too — skills declaring hooks are skipped
 * outright before detection runs (see the disposition rule in `discover.ts`).
 *
 * Every feature here must be able to trigger a warning on its own. Reporting a
 * loss is this module's job; cataloguing every construct that depends on that
 * loss is linting the author's file, which is not. That rule is why `$1` and
 * `$name` are absent despite being real Claude features: neither can occur
 * without `$ARGUMENTS`, `arguments:`, or `argument-hint:` already reporting it.
 */

/** A Claude feature that is outside the AgentSkills.io spec and unmodelled by a16n's IR. */
export interface NonSpecFeature {
  /** Stable identifier, used to pin test coverage to this list. */
  id: string;
  /** Human-readable name, as it appears in the advisory warning. */
  label: string;
}

/** Frontmatter keys Claude honours that the AgentSkills.io spec does not define. */
const NON_SPEC_FRONTMATTER_KEYS = [
  'argument-hint',
  'arguments',
  'model',
  'effort',
  'context',
  'agent',
  'shell',
  'disallowed-tools',
  'user-invocable',
];

/**
 * Every reportable non-spec feature, in the order detections are reported.
 *
 * Single source of truth: the detector, its tests, and the plugin README all
 * derive from this list rather than restating it.
 */
export const NON_SPEC_FEATURES: NonSpecFeature[] = [
  ...NON_SPEC_FRONTMATTER_KEYS.map(key => ({ id: key, label: `${key}:` })),
  { id: 'arguments-substitution', label: '$ARGUMENTS' },
  { id: 'bash-injection', label: '!`cmd` bash injection' },
  { id: 'claude-variables', label: '${CLAUDE_*} variables' },
  { id: 'path-includes', label: '@path file includes' },
];

/**
 * `!` immediately followed by a backtick-delimited command, where the `!` opens
 * a line or follows whitespace. Claude leaves `KEY=!`cmd`` literal, so the
 * leading-boundary requirement is its documented rule, not a heuristic.
 */
const BASH_INJECTION = /(?:^|\s)!`[^`]+`/;

/**
 * `@` reference that is shaped like a path: whitespace-preceded, and either
 * rooted (`/`, `./`, `../`) or carrying a file extension.
 *
 * Rejects the #142 false-positive class — prose mentions (`@reviewer`), email
 * addresses (`foo@bar.com`, not whitespace-preceded), and scoped npm packages
 * (`@scope/pkg`, no extension). Extensionless path references like `@src/utils`
 * are a deliberate false negative: they are lexically identical to a package.
 */
const PATH_INCLUDE = /(?:^|\s)@(?:\.{0,2}\/\S+|\S+\.[A-Za-z0-9]{1,4}(?=[\s.,;:!?)\]]|$))/;

/**
 * Detect the non-spec features used by a Claude skill.
 *
 * @param frontmatter - Parsed SKILL.md frontmatter, as produced by gray-matter
 * @param body - SKILL.md body content
 * @returns Labels of detected features, deduplicated, in `NON_SPEC_FEATURES` order
 */
export function detectNonSpecFeatures(
  frontmatter: Record<string, unknown>,
  body: string,
): string[] {
  const bodyFeatures: Record<string, boolean> = {
    'arguments-substitution': body.includes('$ARGUMENTS'),
    'bash-injection': BASH_INJECTION.test(body),
    'claude-variables': body.includes('${CLAUDE_'),
    'path-includes': PATH_INCLUDE.test(body),
  };

  return NON_SPEC_FEATURES.filter(
    feature => bodyFeatures[feature.id] ?? feature.id in frontmatter,
  ).map(feature => feature.label);
}
