import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, userProfiles, auditLogs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
  const p = await db.select().from(userProfiles).where(eq(userProfiles.userId, auth.userId)).limit(1);
  const safeProfile = p[0] ? { ...p[0], idNumber: undefined } : null;
  return NextResponse.json({ user: u[0], profile: safeProfile });
}
export async function PUT(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const { name, phone, address, city, country, bankName, bankAccount, upiId } = data;
  if (name) await db.update(users).set({ name, phone: phone || null, updatedAt: new Date() }).where(eq(users.id, auth.userId));
  else if (phone) await db.update(users).set({ phone }).where(eq(users.id, auth.userId));

  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, auth.userId)).limit(1);
  if (existing.length) {
    await db.update(userProfiles).set({ address, city, country, bankName, bankAccount, upiId, updatedAt: new Date() }).where(eq(userProfiles.userId, auth.userId));
  } else {
    await db.insert(userProfiles).values({ id: generateId(), userId: auth.userId, address, city, country, bankName, bankAccount, upiId });
  }
  await db.insert(auditLogs).values({ id: generateId(), actorId: auth.userId, action: "update_profile", entity: "user", entityId: auth.userId, details: { name, city } });
  return NextResponse.json({ success: true });
}
