import { describe, it, expect } from 'vitest';
import { WarningCode, type AgentSkillSpecFields } from '@a16njs/models';
import { resolveSkillFieldSupport } from '../src/skill-field-support.js';

/**
 * The AgentSkills.io spec-field disposition table for Cursor emit surfaces.
 *
 * Two axes decide the outcome independently: whether the surface can carry the
 * bytes (decides what is written) and whether Cursor honours the semantics
 * (decides whether anything is lost). `allowed-tools` is the only field where
 * the two disagree, which is why it is the only one that warns on a surface
 * that writes it.
 */
describe('resolveSkillFieldSupport', () => {
  const allFields: AgentSkillSpecFields = {
    license: 'Apache-2.0',
    compatibility: 'Requires Node 22+',
    specMetadata: { author: 'Texarkanine' },
    allowedTools: 'Bash(rm:*)',
  };

  const inertFields: AgentSkillSpecFields = {
    license: 'Apache-2.0',
    compatibility: 'Requires Node 22+',
    specMetadata: { author: 'Texarkanine' },
  };

  describe('SKILL.md surface (carries unknown keys inertly)', () => {
    it('should write inert fields with no warning', () => {
      const result = resolveSkillFieldSupport('skill-md', inertFields, 'deploy');

      expect(result.fields).toEqual(inertFields);
      expect(result.warning).toBeNull();
    });

    it('should write allowed-tools AND warn that it is unenforced', () => {
      const result = resolveSkillFieldSupport('skill-md', { allowedTools: 'Bash(rm:*)' }, 'clean');

      // Preserve the author's bytes...
      expect(result.fields.allowedTools).toBe('Bash(rm:*)');
      // ...but fail closed, because the emitted skill is more permissive than authored.
      expect(result.warning?.code).toBe(WarningCode.Skipped);
      expect(result.warning?.message).toContain('allowed-tools');
      expect(result.warning?.message).toContain('clean');
    });

    it('should raise exactly one warning when all four fields are present', () => {
      const result = resolveSkillFieldSupport('skill-md', allFields, 'clean');

      expect(result.fields).toEqual(allFields);
      expect(result.warning).not.toBeNull();
      // Fire-alone rule: one warning naming the real loss, not one per field.
      expect(result.warning?.code).toBe(WarningCode.Skipped);
    });

    it('should stay silent when no spec fields are present', () => {
      const result = resolveSkillFieldSupport('skill-md', {}, 'plain');

      expect(result.fields).toEqual({});
      expect(result.warning).toBeNull();
    });
  });

  describe('.mdc surface (fixed schema — carries nothing)', () => {
    it('should drop inert fields and raise one Approximated warning', () => {
      const result = resolveSkillFieldSupport('mdc', inertFields, 'deploy');

      expect(result.fields).toEqual({});
      expect(result.warning?.code).toBe(WarningCode.Approximated);
      expect(result.warning?.message).toContain('license');
      expect(result.warning?.message).toContain('compatibility');
      expect(result.warning?.message).toContain('metadata');
    });

    it('should escalate to Skipped when allowed-tools is among the dropped fields', () => {
      const result = resolveSkillFieldSupport('mdc', allFields, 'clean');

      expect(result.fields).toEqual({});
      expect(result.warning?.code).toBe(WarningCode.Skipped);
      expect(result.warning?.message).toContain('allowed-tools');
    });

    it('should raise exactly one warning naming all dropped fields', () => {
      const result = resolveSkillFieldSupport('mdc', allFields, 'clean');

      expect(result.warning).not.toBeNull();
      expect(result.warning?.message).toContain('license');
      expect(result.warning?.message).toContain('compatibility');
      expect(result.warning?.message).toContain('metadata');
      expect(result.warning?.message).toContain('allowed-tools');
    });

    it('should stay silent when no spec fields are present', () => {
      const result = resolveSkillFieldSupport('mdc', {}, 'plain');

      expect(result.fields).toEqual({});
      expect(result.warning).toBeNull();
    });

    it('should not report an empty specMetadata as a dropped field', () => {
      const result = resolveSkillFieldSupport('mdc', { specMetadata: {} }, 'plain');

      expect(result.warning).toBeNull();
    });
  });
});
