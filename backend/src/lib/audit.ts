/**
 * Audit log primitives.
 *
 * Two functions, two contracts:
 *
 * 1) audit(tx, …)
 *    Inside a Drizzle transaction. Use this from EVERY mutating staff
 *    endpoint. The audit row writes in the same txn as the data write,
 *    so audit cannot drift from data state — if the data commits, the
 *    audit row commits with it; if either fails, both roll back.
 *
 * 2) auditRead(req, …)
 *    Fire-and-forget. Use this on EVERY staff read of customer-data:
 *    customer search hit, customer profile open, medical profile view.
 *    A read failure must not fail the response, so we never await this
 *    in a way that blocks the user — but the row landing matters for
 *    PDPL compliance and we surface failures via console.warn so the
 *    operator notices when something is broken.
 *
 * The middleware (middleware/staff.ts → attachAuditActor) sets
 * c.var.auditActor on the Hono context. Routes pull from there and pass
 * to these helpers. Doing it explicitly (rather than auto-wrapping every
 * route) keeps each call site honest about what's being logged.
 */

import type { Context } from 'hono';
import { db, schema } from '../db/index.ts';
import type { UserRole } from './jwt.ts';

export type AuditActor = {
  userId: string;
  role: UserRole;
  ipAddr: string | null;
  userAgent: string | null;
};

export type AuditMutation<TBefore = unknown, TAfter = unknown> = {
  action: string; // e.g. 'product.update', 'prescription.approve'
  entityType: string;
  entityId: string | null;
  before: TBefore | null;
  after: TAfter | null;
};

export type AuditRead = {
  action: string; // e.g. 'customer.search', 'customer.medical_profile_view'
  entityType: string;
  entityId: string | null;
  scope?: string; // optional human-readable scope ("Rx review #PR-0034")
};

/**
 * Drizzle transaction helper. SYNCHRONOUS by design.
 *
 * better-sqlite3 throws if a transaction callback returns a promise
 * (it commits/rolls back synchronously). The whole project commits to
 * sync transactions for SQLite — see backend/src/routes/orders.ts for
 * the existing pattern. When/if we move to Postgres, the txn surface
 * gets refactored at that boundary; not here.
 *
 * Caller passes `tx` from inside `db.transaction((tx) => ...)`, NOT
 * `async (tx) => ...`. Inside that body, `audit(tx, ...)` runs the
 * insert via `.run()` — never `await`.
 */
type SyncTxLike = {
  insert: (typeof db)['insert'];
};

export function audit(
  tx: SyncTxLike,
  actor: AuditActor,
  m: AuditMutation
): void {
  // .run() is the better-sqlite3 sync execution path. Same pattern as
  // orders.ts — see that file for prior art.
  (tx.insert(schema.auditLog).values({
    actorUserId: actor.userId,
    actorRole: actor.role,
    action: m.action,
    entityType: m.entityType,
    entityId: m.entityId,
    beforeJson: m.before ? JSON.stringify(m.before) : null,
    afterJson: m.after ? JSON.stringify(m.after) : null,
    ipAddr: actor.ipAddr,
    userAgent: actor.userAgent,
  }) as unknown as { run: () => void }).run();
}

/**
 * Fire-and-forget read log. The caller does not await this; failures
 * are surfaced via console.warn so the operator can investigate but the
 * response to the user is not blocked.
 *
 * If the caller WANTS to await (in tests, for example), the returned
 * promise resolves either way — even on insert failure we swallow.
 */
export function auditRead(actor: AuditActor, r: AuditRead): Promise<void> {
  return db
    .insert(schema.auditLog)
    .values({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      beforeJson: null,
      afterJson: r.scope ? JSON.stringify({ scope: r.scope }) : null,
      ipAddr: actor.ipAddr,
      userAgent: actor.userAgent,
    })
    .then(() => undefined)
    .catch((err) => {
      // Do NOT throw. Read paths must not 500 because we couldn't
      // append to the audit log. Surface the failure so an operator
      // notices.
      console.warn(
        '[audit] read-log failure',
        { action: r.action, entityType: r.entityType, entityId: r.entityId },
        err
      );
    });
}

/**
 * Convenience: pull the actor off the Hono context. Routes that already
 * went through `requireStaff` middleware can call this directly. We type
 * loosely so any Hono context whose Variables include `auditActor`
 * works, regardless of additional Variables on the route's own type.
 */
export function actorFromContext(c: Context<{ Variables: { auditActor: AuditActor } }>): AuditActor;
export function actorFromContext(c: { var: { auditActor: AuditActor } }): AuditActor;
export function actorFromContext(c: { var: { auditActor: AuditActor } }): AuditActor {
  return c.var.auditActor;
}
