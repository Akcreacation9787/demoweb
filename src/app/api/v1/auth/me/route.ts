import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { users, walletAccounts, userProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await db.select().from(users).where(eq(users.id, auth.userId)).limit(1);
  if (!u.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const wallet = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, auth.userId)).limit(1);
  const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, auth.userId)).limit(1);
  return NextResponse.json({ user: u[0], wallet: wallet[0] || null, profile: profile[0] || null });
}
