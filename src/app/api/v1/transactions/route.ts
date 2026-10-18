import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { ledgerEntries } from "@/db/schema";
import { eq, desc, like, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const q = searchParams.get("q");

  let all = await db.select().from(ledgerEntries).where(eq(ledgerEntries.userId, auth.userId)).orderBy(desc(ledgerEntries.createdAt));
  if (type) all = all.filter(r => r.type === type);
  if (status) all = all.filter(r => r.status === status);
  if (q) all = all.filter(r => r.description?.toLowerCase().includes(q.toLowerCase()) || r.referenceId.toLowerCase().includes(q.toLowerCase()));

  const total = all.length;
  const paged = all.slice((page-1)*limit, page*limit);
  return NextResponse.json({ transactions: paged, total, page, limit, totalPages: Math.ceil(total/limit) });
}
