/**
 * Staff-only middleware.
 *
 * Mounts on /staff/* routes. Two responsibilities:
 *
 *   1) requireStaff: 401 if no JWT, 403 if JWT belongs to a customer.
 *      Catches the case where a leaked customer token is used against
 *      the admin surface — defense in depth on top of /staff/auth/login
 *      (which itself rejects customer credentials at sign-in time).
 *
 *   2) attachAuditActor: builds an AuditActor from the JWT + request and
 *      sets it on c.var.auditActor so route handlers can pass it to
 *      audit() / auditRead() without rebuilding it each time.
 *
 * The middleware does NOT auto-write audit rows. Routes call audit()
 * explicitly so each call site owns its own audit story (action name,
 * before/after, entity ids).
 */

import type { Context, Next } from 'hono';
import { isStaffRole, verifySession, type SessionClaims } from '../lib/jwt.ts';
import type { AuditActor } from '../lib/audit.ts';

export type StaffVariables = {
  user: SessionClaims;
  auditActor: AuditActor;
};

export async function requireStaff(
  c: Context<{ Variables: StaffVariables }>,
  next: Next
) {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return c.json({ error: 'missing_authorization_header' }, 401);

  const claims = await verifySession(token);
  if (!claims) return c.json({ error: 'invalid_or_expired_token' }, 401);

  if (!isStaffRole(claims.role))
    return c.json({ error: 'staff_only' }, 403);

  c.set('user', claims);
  c.set('auditActor', {
    userId: claims.sub,
    role: claims.role,
    ipAddr:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      null,
    userAgent: c.req.header('user-agent') ?? null,
  });

  await next();
}
