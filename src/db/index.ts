import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const globalForDb = globalThis as typeof globalThis & { __aterMysqlPool?: Pool };

export const pool =
  globalForDb.__aterMysqlPool ??
  createPool(databaseUrl);

if (process.env.NODE_ENV !== "production") {
  globalForDb.__aterMysqlPool = pool;
}

export const db = drizzle(pool);
