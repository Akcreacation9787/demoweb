import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { referralRelationships, users, walletAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase();
  const statusFilter = searchParams.get("status");

  const rels = await db.select().from(referralRelationships).where(eq(referralRelationships.referrerId, auth.userId));
  let members = [];
  for (const r of rels) {
    const u = await db.select().from(users).where(eq(users.id, r.referredId)).limit(1);
    if (!u.length) continue;
    const w = await db.select().from(walletAccounts).where(eq(walletAccounts.userId, r.referredId)).limit(1);
    members.push({ user: u[0], wallet: w[0] || null, level: r.level, joinedAt: r.createdAt });
  }
  if (search) members = members.filter(m => m.user.name.toLowerCase().includes(search) || m.user.email.toLowerCase().includes(search));
  if (statusFilter) members = members.filter(m => m.user.accountStatus === statusFilter);

  // Genealogy tree: group by level
  const tree = {
    root: auth.userId,
    level1: members.filter(m=>m.level===1),
    level2: members.filter(m=>m.level===2),
    level3: members.filter(m=>m.level===3),
  };
  return NextResponse.json({ members, tree, total: members.length });
}
