import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, walletAccounts, auditLogs } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","support_agent"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  let list = await db.select().from(users).orderBy(desc(users.createdAt)).limit(100);
  if (q) list = list.filter(u => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));
  // attach wallet
  const enriched = [];
  for (const u of list) {
    const w = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, u.id)).limit(1);
    enriched.push({ ...u, wallet: w[0] || null });
  }
  return NextResponse.json({ users: enriched });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, action, value } = await req.json();
  if (!userId || !action) return NextResponse.json({ error: "Missing" }, { status: 400 });
  if (action === "updateStatus") {
    await db.update(users).set({ accountStatus: value }).where(eq(users.id, userId));
    await db.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_user_status", entity: "user", entityId: userId, details: { status: value } });
  } else if (action === "updateRole") {
    await db.update(users).set({ role: value }).where(eq(users.id, userId));
    await db.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_user_role", entity: "user", entityId: userId, details: { role: value } });
  }
  return NextResponse.json({ success: true });
}
