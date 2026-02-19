import { describe, it, expect } from 'vitest';
import {
  parseIRVersion,
  areVersionsCompatible,
  getCurrentVersion,
  CURRENT_IR_VERSION,
  type IRVersion,
} from '../src/version.js';

describe('IRVersion', () => {
  describe('CURRENT_IR_VERSION', () => {
    it('should be v1beta2', () => {
      expect(CURRENT_IR_VERSION).toBe('v1beta2');
    });
  });

  describe('parseIRVersion', () => {
    it('should parse valid versions with trailing numbers', () => {
      // Valid: v1beta1, v2alpha3, v10stable5
      const v1 = parseIRVersion('v1beta1');
      expect(v1).toEqual({ major: 1, stability: 'beta', revision: 1 });

      const v2 = parseIRVersion('v2alpha3');
      expect(v2).toEqual({ major: 2, stability: 'alpha', revision: 3 });

      const v3 = parseIRVersion('v10stable5');
      expect(v3).toEqual({ major: 10, stability: 'stable', revision: 5 });
    });

    it('should reject versions without trailing numbers', () => {
      // Invalid: v1, v2beta, v1alpha
      expect(parseIRVersion('v1')).toBeNull();
      expect(parseIRVersion('v2beta')).toBeNull();
      expect(parseIRVersion('v1alpha')).toBeNull();
    });

    it('should reject malformed versions', () => {
      // Invalid: 1beta1, vbeta1, v1-beta1
      expect(parseIRVersion('1beta1')).toBeNull();
      expect(parseIRVersion('vbeta1')).toBeNull();
      expect(parseIRVersion('v1-beta1')).toBeNull();
      expect(parseIRVersion('')).toBeNull();
      expect(parseIRVersion('invalid')).toBeNull();
    });

    it('should extract major version correctly', () => {
      // v1beta1 -> major: 1
      // v10alpha5 -> major: 10
      const v1 = parseIRVersion('v1beta1');
      expect(v1?.major).toBe(1);

      const v10 = parseIRVersion('v10alpha5');
      expect(v10?.major).toBe(10);
    });

    it('should extract stability correctly', () => {
      // v1beta1 -> stability: 'beta'
      // v1alpha2 -> stability: 'alpha'
      // v1stable1 -> stability: 'stable'
      // v11 -> stability: '' (empty for stable)
      const beta = parseIRVersion('v1beta1');
      expect(beta?.stability).toBe('beta');

      const alpha = parseIRVersion('v1alpha2');
      expect(alpha?.stability).toBe('alpha');

      const stable = parseIRVersion('v1stable1');
      expect(stable?.stability).toBe('stable');

      const emptyStable = parseIRVersion('v11');
      expect(emptyStable?.stability).toBe('');
    });

    it('should extract revision correctly', () => {
      // v1beta1 -> revision: 1
      // v2alpha3 -> revision: 3
      const v1 = parseIRVersion('v1beta1');
      expect(v1?.revision).toBe(1);

      const v2 = parseIRVersion('v2alpha3');
      expect(v2?.revision).toBe(3);
    });
  });

  describe('areVersionsCompatible', () => {
    it('should return true when reader and file versions match exactly', () => {
      // v1beta1 reader, v1beta1 file -> compatible
      expect(areVersionsCompatible('v1beta1', 'v1beta1')).toBe(true);
      expect(areVersionsCompatible('v2alpha5', 'v2alpha5')).toBe(true);
    });

    it('should return true when reader has newer revision (forward compat)', () => {
      // v1beta2 reader, v1beta1 file -> compatible (reader can read older files)
      expect(areVersionsCompatible('v1beta2', 'v1beta1')).toBe(true);
      expect(areVersionsCompatible('v1beta10', 'v1beta1')).toBe(true);
      expect(areVersionsCompatible('v2alpha5', 'v2alpha3')).toBe(true);
    });

    it('should return false when file has newer revision than reader', () => {
      // v1beta1 reader, v1beta2 file -> incompatible (file too new)
      expect(areVersionsCompatible('v1beta1', 'v1beta2')).toBe(false);
      expect(areVersionsCompatible('v1beta1', 'v1beta10')).toBe(false);
      expect(areVersionsCompatible('v2alpha3', 'v2alpha5')).toBe(false);
    });

    it('should return false when major versions differ', () => {
      // v2beta1 reader, v1beta1 file -> incompatible
      // v1beta1 reader, v2beta1 file -> incompatible
      expect(areVersionsCompatible('v2beta1', 'v1beta1')).toBe(false);
      expect(areVersionsCompatible('v1beta1', 'v2beta1')).toBe(false);
      expect(areVersionsCompatible('v3alpha1', 'v1alpha1')).toBe(false);
    });

    it('should return false when stability differs', () => {
      // v1beta1 reader, v1alpha1 file -> incompatible
      // v1stable1 reader, v1beta1 file -> incompatible
      expect(areVersionsCompatible('v1beta1', 'v1alpha1')).toBe(false);
      expect(areVersionsCompatible('v1stable1', 'v1beta1')).toBe(false);
      expect(areVersionsCompatible('v1alpha1', 'v1beta1')).toBe(false);
    });

    it('should handle empty stability as stable', () => {
      // v11 is same as v1stable1
      expect(areVersionsCompatible('v11', 'v1stable1')).toBe(true);
      expect(areVersionsCompatible('v1stable1', 'v11')).toBe(true);
      expect(areVersionsCompatible('v12', 'v11')).toBe(true);
    });

    it('should return false for invalid versions', () => {
      expect(areVersionsCompatible('invalid', 'v1beta1')).toBe(false);
      expect(areVersionsCompatible('v1beta1', 'invalid')).toBe(false);
      expect(areVersionsCompatible('v1', 'v1beta1')).toBe(false);
    });
  });

  describe('getCurrentVersion', () => {
    it('should return the current IR version', () => {
      // Should match CURRENT_IR_VERSION
      expect(getCurrentVersion()).toBe(CURRENT_IR_VERSION);
      expect(getCurrentVersion()).toBe('v1beta2');
    });
  });
});
