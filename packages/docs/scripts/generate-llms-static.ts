/**
 * Generate LLM artifacts into static/ for local docusaurus start serving.
 *
 * Usage: npx tsx scripts/generate-llms-static.ts
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateLlmsIntoStatic } from './llms-static.js';

const docsDir = join(dirname(fileURLToPath(import.meta.url)), '..');

generateLlmsIntoStatic(docsDir).catch((err) => {
  console.error('Error generating LLM static preview:', err);
  process.exit(1);
});
