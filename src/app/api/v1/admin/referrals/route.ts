import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { referralRelationships, users } from "@/db/schema";
import { getUserFromRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth || !["admin", "super_admin"].includes(auth.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [relationships, clients] = await Promise.all([
      db.select().from(referralRelationships).orderBy(desc(referralRelationships.createdAt)).limit(500),
      db.select({ id: users.id, name: users.name, email: users.email, referralCode: users.referralCode }).from(users),
    ]);
    const byId = new Map(clients.map((client) => [client.id, client]));
    return NextResponse.json({ referrals: relationships.map((relationship) => ({
      ...relationship,
      referrer: byId.get(relationship.referrerId) || null,
      referred: byId.get(relationship.referredId) || null,
    })) });
  } catch (error) {
    console.error("Admin referrals load failed", error);
    return NextResponse.json({ error: "Could not load referrals" }, { status: 500 });
  }
}
