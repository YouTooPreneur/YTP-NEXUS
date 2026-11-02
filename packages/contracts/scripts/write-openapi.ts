import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateOpenApi } from '../src/openapi.js';

const target = fileURLToPath(new URL('../openapi.json', import.meta.url));
writeFileSync(target, `${JSON.stringify(generateOpenApi(), null, 2)}\n`, 'utf8');
console.log('openapi.json written');
