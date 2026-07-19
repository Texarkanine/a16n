/**
 * Clear static/versions.json so VersionPicker does not advertise API versions
 * after a prose-only docs:sync (which wipes .generated API trees).
 *
 * Usage: npx tsx scripts/clear-versions-manifest.ts
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeVersionsManifestFile } from './generate-versioned-api.js';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..');
writeVersionsManifestFile(docsDir, {});
console.log('Cleared static/versions.json');
