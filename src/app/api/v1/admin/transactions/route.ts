import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { ledgerEntries, users } from "@/db/schema";
import { getUserFromRequest } from "@/lib/api-auth";

const allowedRoles = ["admin", "super_admin", "finance_operator"];

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !allowedRoles.includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [entries, clients] = await Promise.all([
      db.select().from(ledgerEntries).orderBy(desc(ledgerEntries.createdAt)).limit(500),
      db.select({ id: users.id, name: users.name }).from(users),
    ]);
    const names = new Map(clients.map((client) => [client.id, client.name]));
    return NextResponse.json({ transactions: entries.map((entry) => ({ ...entry, userName: names.get(entry.userId) || "Client" })) });
  } catch (error) {
    console.error("Admin transactions load failed", error);
    return NextResponse.json({ error: "Could not load transactions" }, { status: 500 });
  }
}
