import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { referralRelationships, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rels = await db.select().from(referralRelationships).where(eq(referralRelationships.referrerId, auth.userId));
  // fetch referred users
  const team = [];
  for (const r of rels) {
    const u = await db.select().from(users).where(eq(users.id, r.referredId)).limit(1);
    if (u.length) team.push({ ...u[0], level: r.level, joinedAt: r.createdAt, relationshipId: r.id });
  }
  // Build genealogy for UI (direct 4 + nested)
  const direct = team.filter(t => t.level === 1);
  const indirect = team.filter(t => t.level > 1);
  return NextResponse.json({ direct, indirect, all: team, total: team.length });
}
