import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { hashPassword, verifyPassword } from '../lib/passwords.ts';
import { signSession } from '../lib/jwt.ts';
import { requireAuth, type AuthVariables } from '../middleware/auth.ts';

export const authRoutes = new Hono<{ Variables: AuthVariables }>();

authRoutes.post('/signup', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { email, password, firstName, lastName, phone } = body as Record<
    string,
    unknown
  >;

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(email))
    return c.json({ error: 'invalid_email' }, 400);
  if (typeof password !== 'string' || password.length < 8)
    return c.json({ error: 'password_too_short', min: 8 }, 400);
  if (typeof firstName !== 'string' || !firstName.trim())
    return c.json({ error: 'first_name_required' }, 400);

  const normalized = email.trim().toLowerCase();
  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  if (existing) return c.json({ error: 'email_already_registered' }, 409);

  const [created] = await db
    .insert(schema.users)
    .values({
      email: normalized,
      passwordHash: hashPassword(password),
      firstName: firstName.trim(),
      lastName: typeof lastName === 'string' ? lastName.trim() : '',
      phone: typeof phone === 'string' ? phone.trim() : '',
    })
    .returning();

  const token = await signSession({
    sub: created.id,
    email: created.email,
    role: created.role,
  });

  return c.json({
    token,
    user: publicUser(created),
  });
});

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string')
    return c.json({ error: 'invalid_credentials' }, 400);

  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);

  // Constant-ish time: still hash a dummy password if user is missing so the
  // attacker can't easily distinguish "no such email" from "wrong password".
  const valid = user
    ? verifyPassword(password, user.passwordHash)
    : (verifyPassword(password, '$dummy$dummy$dummy'), false);

  if (!user || !valid) return c.json({ error: 'invalid_credentials' }, 401);

  const token = await signSession({
    sub: user.id,
    email: user.email,
    role: user.role,
  });
  return c.json({ token, user: publicUser(user) });
});

authRoutes.get('/me', requireAuth, async (c) => {
  const claims = c.get('user');
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, claims.sub))
    .limit(1);
  if (!user) return c.json({ error: 'user_not_found' }, 404);
  return c.json({ user: publicUser(user) });
});

function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt,
  };
}
