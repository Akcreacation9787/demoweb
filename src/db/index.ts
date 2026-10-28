import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & { __aterPostgresPool?: Pool };

export const pool =
  globalForDb.__aterPostgresPool ??
  new Pool({ connectionString: databaseUrl, max: 5 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__aterPostgresPool = pool;
}

export const db = drizzle(pool);
