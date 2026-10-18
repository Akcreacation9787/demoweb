import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { investmentRecords } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const records = await db.select().from(investmentRecords).where(eq(investmentRecords.userId, auth.userId)).orderBy(desc(investmentRecords.createdAt));
  return NextResponse.json({ investments: records });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(
    { error: "Direct investment creation is disabled. Create and verify a payment order first." },
    { status: 410 },
  );
}
