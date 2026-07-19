/**
 * Clear static manifests that must not outlive a docs:sync wipe of .generated:
 * - versions.json (VersionPicker)
 * - LLM preview artifacts (llms*.txt and generated .md mirrors)
 *
 * Usage: npx tsx scripts/clear-static-generated.ts
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeVersionsManifestFile } from './generate-versioned-api.js';
import { clearStaticLlmsArtifacts } from './llms-static.js';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticRoot = join(docsDir, 'static');

writeVersionsManifestFile(docsDir, {});
const removed = clearStaticLlmsArtifacts(staticRoot);
console.log('Cleared static/versions.json');
if (removed.length > 0) {
  console.log(`Cleared ${removed.length} static LLM artifact(s)`);
}
