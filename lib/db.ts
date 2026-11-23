import { Pool } from "pg";

declare global { var petPool: Pool | undefined }
export const pool = globalThis.petPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});
if (process.env.NODE_ENV !== "production") globalThis.petPool = pool;

export async function query<T extends import("pg").QueryResultRow>(sql: string, args: unknown[] = []) {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  return pool.query<T>(sql, args);
}
