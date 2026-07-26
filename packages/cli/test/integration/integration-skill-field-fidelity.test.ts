/**
 * Integration tests: AgentSkills.io spec-field fidelity across every route.
 *
 * The bug this task fixes (#143) was not "one field was forgotten" but "nobody
 * was checking". Example-based tests prove the cases someone thought to write;
 * they cannot fail when a *combination* is missed, which is exactly how four
 * fields went missing across three plugins in the first place.
 *
 * So this file asserts a property over all 2^4 subsets of the spec fields:
 *
 *   **No field may be both absent from the output and unmentioned in the warnings.**
 *
 * Silence is the only failure mode that matters. Preserving a field is fine.
 * Dropping a field and saying so is fine. Dropping it quietly is the bug.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { A16nEngine } from '@a16njs/engine';
import { createIntegrationEngine, suiteTempDir } from '../test-support/integration-helpers.js';

/** One spec field: how it is written, and how to recognise it on the way out. */
interface SpecField {
  /** Frontmatter key as it appears on disk. */
  key: string;
  /** Value used for every test case; distinctive enough to grep for. */
  value: string;
  /**
   * Substring that must appear in a warning if the field was dropped.
   * Usually the key, but a warning may name the field rather than the key.
   */
  warningNeedle: string;
}

const SPEC_FIELDS: SpecField[] = [
  { key: 'license', value: 'Apache-2.0', warningNeedle: 'license' },
  { key: 'compatibility', value: 'Requires Node 22+', warningNeedle: 'compatibility' },
  { key: 'metadata', value: '', warningNeedle: 'metadata' },
  { key: 'allowed-tools', value: 'Bash(rm:*) Read', warningNeedle: 'allowed-tools' },
];

/** Every subset of the four fields, as a bitmask over `SPEC_FIELDS`. */
const COMBINATIONS = Array.from({ length: 1 << SPEC_FIELDS.length }, (_, mask) => ({
  mask,
  fields: SPEC_FIELDS.filter((_f, i) => (mask & (1 << i)) !== 0),
  label:
    SPEC_FIELDS.filter((_f, i) => (mask & (1 << i)) !== 0)
      .map(f => f.key)
      .join('+') || '(none)',
}));

/** Render a Claude SKILL.md carrying exactly the given spec fields. */
function skillSource(name: string, fields: SpecField[]): string {
  const lines = [`name: ${name}`, `description: A skill for testing spec fields`];

  for (const field of fields) {
    // `metadata` is the only nested value, so it cannot use the flat form.
    if (field.key === 'metadata') {
      lines.push('metadata:', '  author: Texarkanine');
    } else {
      lines.push(`${field.key}: ${JSON.stringify(field.value)}`);
    }
  }

  return `---\n${lines.join('\n')}\n---\n\nBody of the ${name} skill.\n`;
}

/** Write a Claude skill into `<root>/.claude/skills/<name>/SKILL.md`. */
async function writeClaudeSkill(root: string, name: string, fields: SpecField[]): Promise<void> {
  const dir = path.join(root, '.claude', 'skills', name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'SKILL.md'), skillSource(name, fields), 'utf-8');
}

/**
 * Collect the frontmatter keys present across every emitted file under `root`.
 *
 * Keys are unioned rather than tracked per-file because the property is about
 * the conversion as a whole: a field survives if it landed *somewhere* in the
 * output. Only key presence is checked, so this reads the frontmatter block
 * directly rather than pulling in a YAML parser the CLI does not depend on.
 */
async function emittedFrontmatterKeys(root: string): Promise<Set<string>> {
  const keys = new Set<string>();

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!entry.name.endsWith('.md') && !entry.name.endsWith('.mdc')) continue;

      const raw = await fs.readFile(full, 'utf-8');
      const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw)?.[1];
      if (!block) continue;

      for (const line of block.split('\n')) {
        const key = /^([A-Za-z][A-Za-z0-9_-]*):/.exec(line)?.[1];
        if (key) keys.add(key);
      }
    }
  }

  await walk(root);
  return keys;
}

describe('Integration Tests - AgentSkills.io spec-field fidelity', () => {
  let engine: A16nEngine;
  let tempDir: string;

  beforeEach(async () => {
    engine = createIntegrationEngine();
    tempDir = suiteTempDir(import.meta.url, 'skill-field-fidelity');
    await fs.rm(tempDir, { recursive: true, force: true });
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('claude → a16n → claude preserves every field', () => {
    /**
     * The IR is a lossless waypoint by definition; a field that does not
     * survive this round-trip is lost to every `.a16n/`-mediated conversion at
     * once, so nothing here is allowed to be dropped-with-a-warning.
     */
    it.each(COMBINATIONS)('should recover $label unchanged', async ({ fields }) => {
      const source = path.join(tempDir, 'source');
      const ir = path.join(tempDir, 'ir');
      const back = path.join(tempDir, 'back');
      await writeClaudeSkill(source, 'deploy', fields);

      await engine.convert({ source: 'claude', target: 'a16n', root: source });
      await fs.mkdir(ir, { recursive: true });
      await fs.cp(path.join(source, '.a16n'), path.join(ir, '.a16n'), { recursive: true });

      await engine.convert({ source: 'a16n', target: 'claude', root: ir });
      await fs.mkdir(back, { recursive: true });
      await fs.cp(path.join(ir, '.claude'), path.join(back, '.claude'), { recursive: true });

      const emitted = await emittedFrontmatterKeys(back);

      for (const field of fields) {
        expect(emitted.has(field.key), `${field.key} did not survive the IR round-trip`).toBe(true);
      }

      // Fields that were never authored must not be invented on the way back.
      for (const field of SPEC_FIELDS.filter(f => !fields.includes(f))) {
        expect(emitted.has(field.key), `${field.key} was fabricated`).toBe(false);
      }
    });
  });

  describe('claude → cursor never loses a field silently', () => {
    it.each(COMBINATIONS)('should preserve or report $label', async ({ fields }) => {
      const source = path.join(tempDir, 'source');
      await writeClaudeSkill(source, 'deploy', fields);

      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: source,
      });

      const emitted = await emittedFrontmatterKeys(path.join(source, '.cursor'));
      const allWarnings = result.warnings.map(w => w.message).join('\n');

      for (const field of fields) {
        const preserved = emitted.has(field.key);
        const reported = allWarnings.includes(field.warningNeedle);

        expect(
          preserved || reported,
          `'${field.key}' vanished silently: not in the emitted frontmatter and not named ` +
            `in any warning. Warnings were:\n${allWarnings || '(none)'}`
        ).toBe(true);
      }
    });

    it('should raise no spec-field warnings for a skill carrying none', async () => {
      const source = path.join(tempDir, 'source');
      await writeClaudeSkill(source, 'deploy', []);

      const result = await engine.convert({
        source: 'claude',
        target: 'cursor',
        root: source,
      });

      const specWarnings = result.warnings.filter(w =>
        SPEC_FIELDS.some(f => w.message.includes(f.warningNeedle))
      );
      expect(specWarnings).toEqual([]);
    });
  });
});
