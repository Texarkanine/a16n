/**
 * AgentSkills.io spec-field disposition for Cursor emit surfaces.
 *
 * Two independent questions decide what happens to `license`, `compatibility`,
 * `metadata`, and `allowed-tools` on the way out:
 *
 * 1. **Can the surface carry the bytes?** `.cursor/skills/*​/SKILL.md` can —
 *    Cursor loads `.claude/skills/` directly, so unknown frontmatter keys are
 *    inert there. `.cursor/rules/*.mdc` cannot: its schema is fixed.
 * 2. **Does Cursor honour the semantics?** Only `allowed-tools` has any, and
 *    Cursor does not enforce it.
 *
 * `allowed-tools` is the sole field where the two answers disagree, which is
 * why it is the only field written *and* warned about. `license` and
 * `compatibility` have no runtime behavior in any harness and `metadata` is
 * officially supported by Cursor, so writing them loses nothing and warning
 * about them would report a loss that did not occur.
 */

import { WarningCode, type AgentSkillSpecFields } from '@a16njs/models';

/** A Cursor output surface, keyed by whether it can carry arbitrary frontmatter. */
export type CursorSkillSurface =
  /** `.cursor/skills/*​/SKILL.md` — arbitrary YAML frontmatter, unknown keys inert. */
  | 'skill-md'
  /** `.cursor/rules/*.mdc` — fixed schema, carries no spec fields at all. */
  | 'mdc';

/** What an emit surface should do with an item's spec fields. */
export interface SkillFieldDisposition {
  /** The spec fields to write. Empty when the surface cannot carry them. */
  fields: AgentSkillSpecFields;
  /**
   * The single warning to raise, or `null` when nothing is lost.
   *
   * One warning per item per surface, never one per field: a warning names a
   * real, self-sufficient loss, so a skill losing three fields on the `.mdc`
   * route produces one line rather than three. Callers supply `sources` — a
   * `Skipped` warning must carry the item's `sourcePath` or the
   * `--delete-source` guard will not engage.
   */
  warning: { code: WarningCode; message: string } | null;
}

/** Spec key names of the fields an item actually carries, in spec order. */
function presentFieldNames(fields: AgentSkillSpecFields): string[] {
  const names: string[] = [];
  if (fields.license) names.push('license');
  if (fields.compatibility) names.push('compatibility');
  if (fields.specMetadata && Object.keys(fields.specMetadata).length > 0) names.push('metadata');
  if (fields.allowedTools) names.push('allowed-tools');
  return names;
}

/**
 * Decide what a Cursor emit surface writes for an item's spec fields, and what
 * (if anything) it must report.
 *
 * @param surface - The output surface being written
 * @param fields - The spec fields the item carries
 * @param displayName - Skill name, for the warning message
 * @returns The fields to write and the single warning to raise, if any
 *
 * @example
 * resolveSkillFieldSupport('skill-md', { allowedTools: 'Bash(rm:*)' }, 'clean')
 * // writes allowed-tools, and raises one Skipped warning
 */
export function resolveSkillFieldSupport(
  surface: CursorSkillSurface,
  fields: AgentSkillSpecFields,
  displayName: string,
): SkillFieldDisposition {
  const present = presentFieldNames(fields);

  if (present.length === 0) {
    return { fields: surface === 'mdc' ? {} : fields, warning: null };
  }

  if (surface === 'mdc') {
    return {
      fields: {},
      warning: {
        code: fields.allowedTools ? WarningCode.Skipped : WarningCode.Approximated,
        message:
          `Skill '${displayName}': Cursor rule files cannot carry AgentSkills.io ` +
          `frontmatter, so ${present.join(', ')} ${present.length === 1 ? 'is' : 'are'} dropped`,
      },
    };
  }

  return {
    fields,
    warning: fields.allowedTools
      ? {
          code: WarningCode.Skipped,
          message:
            `Skill '${displayName}': 'allowed-tools' is preserved but Cursor does not ` +
            `enforce tool restrictions; the emitted skill is more permissive than the source`,
        }
      : null,
  };
}
