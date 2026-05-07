import type { Context, Next } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { hashApiKey } from '../lib/api-key.ts';
import type { ApiKey } from '../db/schema.ts';

export type ApiKeyVariables = { apiKey: ApiKey };

export function requireApiKey(scope?: string) {
  return async (c: Context<{ Variables: ApiKeyVariables }>, next: Next) => {
    const provided = c.req.header('X-API-Key') ?? '';
    if (!provided) return c.json({ error: 'missing_api_key' }, 401);

    const hash = hashApiKey(provided);
    const [row] = await db
      .select()
      .from(schema.apiKeys)
      .where(eq(schema.apiKeys.keyHash, hash))
      .limit(1);

    if (!row) return c.json({ error: 'invalid_api_key' }, 401);
    if (row.revokedAt) return c.json({ error: 'api_key_revoked' }, 401);
    if (scope && !row.scopes.includes(scope))
      return c.json({ error: 'api_key_missing_scope', required: scope }, 403);

    // Best-effort touch; don't fail the request if it errors.
    db.update(schema.apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(schema.apiKeys.id, row.id))
      .run();

    c.set('apiKey', row);
    await next();
  };
}
