/**
 * Live-row query helpers.
 *
 * Soft-deleted rows in `users`, `products`, `orders` are tombstoned by
 * setting `deletedAt`. Default queries MUST filter `deletedAt IS NULL`
 * — a deleted product appearing in the storefront would be a P0 bug.
 *
 * To enforce that discipline architecturally, this module exposes
 * pre-built `where` fragments that callers compose into their queries.
 * The convention is:
 *
 *   db.select().from(schema.products).where(liveProducts())
 *   db.select().from(schema.products).where(and(liveProducts(), eq(...)))
 *
 * Direct table access without `liveX()` is reserved for audit-only
 * paths (e.g. the staff "show me deleted products" surface, when we
 * build it). Such paths must be reviewed and the comment block above
 * the call site must say "intentionally bypasses liveX()".
 *
 * See DESIGN.md → Architecture lockdowns.
 */

import { isNull } from 'drizzle-orm';
import { schema } from '../db/index.ts';

export const liveUsers = () => isNull(schema.users.deletedAt);
export const liveProducts = () => isNull(schema.products.deletedAt);
export const liveOrders = () => isNull(schema.orders.deletedAt);
