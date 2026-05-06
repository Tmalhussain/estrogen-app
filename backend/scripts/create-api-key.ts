import { db, schema } from '../src/db/index.ts';
import { generateApiKey } from '../src/lib/api-key.ts';

const args = process.argv.slice(2);

const labelArg = args.find((a) => a.startsWith('--label='))?.slice(8);
const scopesArg =
  args.find((a) => a.startsWith('--scopes='))?.slice(9) ?? 'stock:read,stock:update';

if (!labelArg) {
  console.error('usage: npm run key:create -- --label="POS terminal #1" [--scopes=stock:read,stock:update]');
  process.exit(1);
}

const scopes = scopesArg
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const { plaintext, prefix, hash } = generateApiKey();

db.insert(schema.apiKeys)
  .values({
    label: labelArg,
    keyPrefix: prefix,
    keyHash: hash,
    scopes,
  })
  .run();

console.log('API key created. SAVE THIS NOW — it is not stored in plaintext:');
console.log('');
console.log(`  ${plaintext}`);
console.log('');
console.log(`label:  ${labelArg}`);
console.log(`prefix: ${prefix}`);
console.log(`scopes: ${scopes.join(', ')}`);
console.log('');
console.log('Use it as the X-API-Key header on /api/stock/* requests.');
