import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.ts';

/**
 * Database driver selection.
 *
 * - `postgres://...` or `postgresql://...` URLs → Postgres via postgres-js.
 *   Use this in production (Cloud SQL, Neon, Supabase, Render, etc).
 * - Anything else (or no DATABASE_URL) → local SQLite via better-sqlite3.
 *
 * The Drizzle schema in ./schema.ts is dialect-agnostic for these tables.
 * For Postgres deployments, generate Postgres migrations with:
 *   DATABASE_URL=postgres://... npx drizzle-kit generate --dialect=postgresql
 *
 * Note on types: we type the export as the SQLite Database for IDE comfort
 * (development uses SQLite). At runtime postgres-js exposes the same Drizzle
 * query builder API — the few differences (sync vs async return shape) only
 * matter inside `db.transaction(...)` blocks where we already use the cb
 * arg. If you write Postgres-only SQL, cast at the call site.
 */

const url = process.env.DATABASE_URL ?? './data.db';
const isPostgres =
  url.startsWith('postgres://') || url.startsWith('postgresql://');

type AnyDb = BetterSQLite3Database<typeof schema>;
let drizzleInstance: AnyDb;

if (isPostgres) {
  const [{ default: postgres }, { drizzle }] = await Promise.all([
    import('postgres'),
    import('drizzle-orm/postgres-js'),
  ]);
  const client = postgres(url, { prepare: false });
  drizzleInstance = drizzle(client, { schema }) as unknown as AnyDb;
} else {
  const [{ default: Database }, { drizzle }] = await Promise.all([
    import('better-sqlite3'),
    import('drizzle-orm/better-sqlite3'),
  ]);
  const sqlite = new Database(url);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  drizzleInstance = drizzle(sqlite, { schema });
}

export const db = drizzleInstance;
export const isPostgresDb = isPostgres;
export { schema };
