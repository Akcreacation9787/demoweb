import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/api-auth";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const list = await db.select().from(supportTickets).where(eq(supportTickets.userId, auth.userId)).orderBy(desc(supportTickets.createdAt));
  return NextResponse.json({ tickets: list });
}
export async function POST(req: NextRequest) {
  const auth = getUserFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subject, message, priority } = await req.json();
  if (!subject || !message) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const id = generateId();
  await db.insert(supportTickets).values({ id, userId: auth.userId, subject, message, priority: priority || "medium", status: "open", createdAt: new Date(), updatedAt: new Date() });
  return NextResponse.json({ success: true, id });
}
