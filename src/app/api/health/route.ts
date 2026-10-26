import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ ok: true, app: "ATER KOMPANY", database: "mysql" });
  } catch (e) {
    console.error("MySQL health check failed", e);
    return NextResponse.json({ ok: false, database: "mysql" }, { status: 503 });
  }
}
