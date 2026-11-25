// Regenerates RULEBOOK_SPEC.md from spec.js. Run: node tools/build-spec.mjs
import { writeFileSync } from 'node:fs';
import { SPEC_TEXT } from '../spec.js';

writeFileSync(new URL('../RULEBOOK_SPEC.md', import.meta.url), SPEC_TEXT);
console.log('RULEBOOK_SPEC.md updated');
