import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import agentsmdPlugin from '../src/index.js';
import {
  CustomizationType,
  WarningCode,
  createId,
  type GlobalPrompt,
} from '@a16njs/models';
import { suiteTempDir } from './test-support/emit-helpers.js';

const tempDir = suiteTempDir(import.meta.url, 'overwrite');

function makeGlobalPrompt(content: string): GlobalPrompt {
  return {
    id: createId(CustomizationType.GlobalPrompt, 'CLAUDE.md'),
    type: CustomizationType.GlobalPrompt,
    name: 'CLAUDE',
    sourcePath: 'CLAUDE.md',
    content,
    metadata: {},
  } as GlobalPrompt;
}

describe('AGENTS.md Plugin Emission (overwrite & idempotency)', () => {
  beforeEach(async () => {
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should overwrite an existing AGENTS.md and emit an Overwritten warning', async () => {
    const target = path.join(tempDir, 'AGENTS.md');
    await fs.writeFile(target, 'Hand-written instructions.\n', 'utf-8');

    const result = await agentsmdPlugin.emit([makeGlobalPrompt('Converted instructions.')], tempDir);

    expect(result.written).toHaveLength(1);
    expect(result.written[0]!.isNewFile).toBe(false);

    const overwritten = result.warnings.filter(w => w.code === WarningCode.Overwritten);
    expect(overwritten).toHaveLength(1);
    expect(overwritten[0]!.message).toContain('AGENTS.md');

    const content = await fs.readFile(target, 'utf-8');
    expect(content).toBe('Converted instructions.\n');
  });

  it('should NOT emit an Overwritten warning when content is byte-identical (idempotent re-run)', async () => {
    const target = path.join(tempDir, 'AGENTS.md');
    await fs.writeFile(target, 'Converted instructions.\n', 'utf-8');

    const result = await agentsmdPlugin.emit([makeGlobalPrompt('Converted instructions.')], tempDir);

    expect(result.written).toHaveLength(1);
    expect(result.written[0]!.isNewFile).toBe(false);
    expect(result.warnings.filter(w => w.code === WarningCode.Overwritten)).toHaveLength(0);
  });

  it('should report isNewFile true and no Overwritten warning for fresh targets', async () => {
    const result = await agentsmdPlugin.emit([makeGlobalPrompt('Fresh.')], tempDir);

    expect(result.written[0]!.isNewFile).toBe(true);
    expect(result.warnings.filter(w => w.code === WarningCode.Overwritten)).toHaveLength(0);
  });

  it('should be idempotent across repeated emissions', async () => {
    const gp = makeGlobalPrompt('Stable content.');

    await agentsmdPlugin.emit([gp], tempDir);
    const second = await agentsmdPlugin.emit([gp], tempDir);
    const third = await agentsmdPlugin.emit([gp], tempDir);

    const content = await fs.readFile(path.join(tempDir, 'AGENTS.md'), 'utf-8');
    expect(content).toBe('Stable content.\n');
    expect(second.warnings.filter(w => w.code === WarningCode.Overwritten)).toHaveLength(0);
    expect(third.warnings.filter(w => w.code === WarningCode.Overwritten)).toHaveLength(0);
  });

  it('should not modify existing files in dry-run but still compute warnings', async () => {
    const target = path.join(tempDir, 'AGENTS.md');
    await fs.writeFile(target, 'Hand-written instructions.\n', 'utf-8');

    const result = await agentsmdPlugin.emit(
      [makeGlobalPrompt('Converted instructions.')],
      tempDir,
      { dryRun: true }
    );

    expect(result.written).toHaveLength(1);
    expect(result.written[0]!.isNewFile).toBe(false);
    expect(result.warnings.filter(w => w.code === WarningCode.Overwritten)).toHaveLength(1);

    const content = await fs.readFile(target, 'utf-8');
    expect(content).toBe('Hand-written instructions.\n');
  });
});
