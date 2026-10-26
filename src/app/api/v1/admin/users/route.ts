import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, walletAccounts, auditLogs } from "@/db/schema";
import { eq, desc, like, or } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin","super_admin","finance_operator","support_agent"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  try {
    const { userId, action, value } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "Missing client action details" }, { status: 400 });
    const [target] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return NextResponse.json({ error: "Client account not found" }, { status: 404 });
    if (action === "updateStatus") {
      if (!["active", "suspended", "pending_verification", "closed"].includes(value)) return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
      await db.transaction(async (tx) => {
        await tx.update(users).set({ accountStatus: value }).where(eq(users.id, userId));
        await tx.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_user_status", entity: "user", entityId: userId, details: { status: value } });
      });
    } else if (action === "updateRole") {
      if (!["user", "admin", "finance_operator", "support_agent", "super_admin"].includes(value)) return NextResponse.json({ error: "Invalid account role" }, { status: 400 });
      if (value === "super_admin" && auth.role !== "super_admin") return NextResponse.json({ error: "Only a super admin can grant the super admin role" }, { status: 403 });
      if (target.role === "super_admin" && auth.role !== "super_admin") return NextResponse.json({ error: "Only a super admin can change this account" }, { status: 403 });
      await db.transaction(async (tx) => {
        await tx.update(users).set({ role: value }).where(eq(users.id, userId));
        await tx.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_user_role", entity: "user", entityId: userId, details: { role: value } });
      });
    } else return NextResponse.json({ error: "Unknown client action" }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin client update failed", error);
    return NextResponse.json({ error: "Could not update client account" }, { status: 500 });
  }
}
