import type { Context, Next } from 'hono';
import { verifySession, type SessionClaims } from '../lib/jwt.ts';

export type AuthVariables = { user: SessionClaims };

export async function requireAuth(c: Context<{ Variables: AuthVariables }>, next: Next) {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'missing_authorization_header' }, 401);
  const claims = await verifySession(token);
  if (!claims) return c.json({ error: 'invalid_or_expired_token' }, 401);
  c.set('user', claims);
  await next();
}
