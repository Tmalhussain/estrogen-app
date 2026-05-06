import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { requireAuth, type AuthVariables } from '../middleware/auth.ts';

export const chatRoutes = new Hono<{ Variables: AuthVariables }>();

chatRoutes.use('*', requireAuth);

/**
 * Publish (or update) the caller's X25519 public key for this device.
 * The mobile generates the keypair on first launch via libsodium /
 * tweetnacl and stores the private key in expo-secure-store. Only the
 * public bytes (base64) ever land here.
 *
 * Idempotent: if the same public key already exists for this user we
 * return the existing row and bump lastSeenAt.
 */
chatRoutes.post('/devices', async (c) => {
  const claims = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { publicKey, deviceLabel } = body as Record<string, unknown>;
  if (typeof publicKey !== 'string' || publicKey.length < 32)
    return c.json({ error: 'invalid_public_key' }, 400);

  const [existing] = await db
    .select()
    .from(schema.chatDevices)
    .where(eq(schema.chatDevices.publicKey, publicKey))
    .limit(1);

  if (existing) {
    if (existing.userId !== claims.sub)
      return c.json({ error: 'public_key_owned_by_other_user' }, 409);
    await db
      .update(schema.chatDevices)
      .set({ lastSeenAt: new Date() })
      .where(eq(schema.chatDevices.id, existing.id));
    return c.json({ device: existing, alreadyRegistered: true });
  }

  const [created] = await db
    .insert(schema.chatDevices)
    .values({
      userId: claims.sub,
      publicKey,
      deviceLabel: typeof deviceLabel === 'string' ? deviceLabel.slice(0, 60) : '',
      lastSeenAt: new Date(),
    })
    .returning();
  return c.json({ device: created, alreadyRegistered: false });
});

chatRoutes.get('/devices', async (c) => {
  const claims = c.get('user');
  const rows = await db
    .select()
    .from(schema.chatDevices)
    .where(eq(schema.chatDevices.userId, claims.sub));
  return c.json({ devices: rows });
});
